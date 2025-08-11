const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mockLlmService = require('./mockLlmService');

// Function to get API key from environment variables
function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

function getLlmProvider() {
  return process.env.LLM_PROVIDER || 'gemini';
}

// Get the LLM provider
const LLM_PROVIDER = getLlmProvider();

// Add debug log to check if API key is available
console.log('GEMINI_API_KEY available:', !!getApiKey());
console.log('LLM_PROVIDER:', LLM_PROVIDER);

const MODEL_NAME_TEXT = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash-latest';
const MODEL_NAME_VISION = process.env.GEMINI_VISION_MODEL || 'gemini-1.5-pro-vision';

exports.processClinicalQuery = async (message, imageUrl, conversationHistory) => {
  try {
    if (process.env.USE_MOCK_LLM === 'true') {
      console.log('Using mock LLM service (explicit setting)');
      return await mockLlmService.processClinicalQuery(message, imageUrl, conversationHistory);
    }

    if (LLM_PROVIDER === 'gemini') {
      return await processWithGemini(message, imageUrl, conversationHistory);
    }
    return await processWithOpenAI(message, imageUrl, conversationHistory);
  } catch (error) {
    console.error('[LLM] Fatal error (will return fallback):', error.message);
    // DO NOT throw – return fallback so API still answers
    return {
      error: true,
      text: `I could not generate a structured response (reason: ${error.message}). Please provide any additional clinical details (duration, associated symptoms, vitals).`,
      primaryDiagnosis: null,
      differentialDiagnoses: [],
      recommendedNextSteps: []
    };
  }
};

async function processWithGemini(message, imageUrl, conversationHistory) {
  const prompt = constructClinicalPrompt(message, conversationHistory);
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }]}],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.9,
      responseMimeType: "text/plain"
    }
  };

  // Add image to the request if provided
  if (imageUrl) {
    try {
      // For local files, read and convert to base64
      if (!imageUrl.startsWith('http')) {
        // Local file path
        const imagePath = path.join(__dirname, '..', '..', 'uploads', path.basename(imageUrl));
        if (fs.existsSync(imagePath)) {
          const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
          
          // Determine mime type from file extension
          const ext = path.extname(imagePath).toLowerCase();
          let mimeType = "image/jpeg";  // default
          if (ext === '.png') mimeType = "image/png";
          if (ext === '.gif') mimeType = "image/gif";
          if (ext === '.bmp') mimeType = "image/bmp";
          if (ext === '.webp') mimeType = "image/webp";
          
          payload.contents[0].parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          });
          console.log('Successfully added image to prompt');
        } else {
          console.error('Image file not found:', imagePath);
        }
      } else {
        // Remote URL - fetch the image and convert to base64
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(imageResponse.data).toString('base64');
        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
        
        payload.contents[0].parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        });
        console.log('Successfully added remote image to prompt');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Continue without the image if there's an error
    }
  }
  
  console.log('[Gemini] Prepared payload (truncated prompt length):', payload.contents[0].parts[0].text.length);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  let modelName = imageUrl ? MODEL_NAME_VISION : MODEL_NAME_TEXT;
  const apiUrlBase = `https://generativelanguage.googleapis.com/v1beta/models/`;
  let apiUrl = `${apiUrlBase}${modelName}:generateContent?key=${apiKey}`;
  console.log('[Gemini] Model:', modelName);

  let retries = 3;
  let delay = 1200;
  let apiResponse;
  let attemptedModels = [modelName];

  while (retries > 0) {
    try {
      apiResponse = await axios.post(apiUrl, payload, { timeout: 20000 });
      break;
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      const retryInfo = err.response?.data?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
      console.error(`[Gemini] Attempt failed (model=${modelName}, status=${status}) msg=${msg} retryDelayHint=${retryInfo?.retryDelay || 'n/a'}`);

      // Automatic model downgrade if using pro and rate-limited
      if (status === 429 && modelName.includes('pro') && !attemptedModels.some(m => m.includes('flash'))) {
        console.log('[Gemini] Downgrading model to flash due to 429');
        const downgraded = MODEL_NAME_TEXT; // flash-latest
        attemptedModels.push(downgraded);
        // rebuild apiUrl with downgraded model
        apiResponse = null;
        retries--; // consume one retry on the failed pro call
        // small wait (use retryDelay if provided)
        const waitMs = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) * 1000 || 2000 : delay;
        await new Promise(r => setTimeout(r, waitMs));
        // swap modelName reference (cannot reassign const; so define modelName with let above)
        modelName = downgraded;
        apiUrl = `${apiUrlBase}${modelName}:generateContent?key=${apiKey}`;
        continue;
      }

      if (status === 429 && retries > 1) {
        const waitMs = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay) * 1000 || delay : delay;
        console.log(`[Gemini] Rate limit – retry in ${waitMs}ms (remaining ${(retries - 1)})`);
        await new Promise(r => setTimeout(r, waitMs));
        delay *= 2;
        retries--;
        continue;
      }

      throw new Error(msg);
    }
  }

  if (!apiResponse) throw new Error('No response after retries');

  const candidate = apiResponse.data?.candidates?.[0];
  if (!candidate) throw new Error('Empty candidates');

  const textPart = (candidate.content?.parts || []).find(p => p.text)?.text;
  if (!textPart) throw new Error('No text part returned');

  console.log('[Gemini] Raw model text (first 200 chars):', textPart.slice(0, 200));
  return parseLLMResponse(textPart, message);
}

async function processWithOpenAI(message, imageUrl, conversationHistory) {
  // Implementation for OpenAI API (GPT-4o)
  // This is a placeholder - you would implement similar logic to the Gemini function
  throw new Error('OpenAI integration not implemented yet');
}

function constructClinicalPrompt(message, conversationHistory) {
  // Format conversation history for context
  const formattedHistory = conversationHistory
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');
  
  return `
You are an expert clinical assistant helping medical professionals analyze patient cases. 
Use your medical knowledge to provide insights based on the following information:

CURRENT QUERY: ${message}

${conversationHistory.length > 0 ? `CONVERSATION HISTORY:
${formattedHistory}` : ''}

Analyze the case and provide a comprehensive assessment. 
Return your response in the following JSON format:

{
  "text": "Your conversational response to the clinician",
  "primaryDiagnosis": {
    "name": "Primary diagnosis name",
    "icd10Code": "ICD-10 code"
  },
  "differentialDiagnoses": [
    {
      "name": "Differential diagnosis 1",
      "icd10Code": "ICD-10 code"
    },
    {
      "name": "Differential diagnosis 2",
      "icd10Code": "ICD-10 code"
    }
  ],
  "recommendedNextSteps": [
    {
      "step": "Recommended action 1"
    },
    {
      "step": "Recommended action 2"
    }
  ]
}

Important guidelines:
1. Provide ICD-10 codes for all diagnoses when possible
2. List 2-4 differential diagnoses if applicable
3. Include specific next steps for assessment, testing, or treatment
4. If insufficient information is provided, request additional details
5. Return ONLY valid JSON - no additional text, markdown, or explanations outside the JSON structure
6. If you can't determine a diagnosis, set primaryDiagnosis to null
7. If examining medical images, include your observations in the text field
`;
}

function parseLLMResponse(responseText, userMessage) {
  try {
    const cleaned = responseText
      .replace(/```(json)?/gi, '')
      .trim();

    let first = cleaned.indexOf('{');
    let last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1) throw new Error('No braces found');
    const jsonSlice = cleaned.substring(first, last + 1);

    const parsed = JSON.parse(jsonSlice);

    if (!parsed.text) parsed.text = 'Clinical analysis generated.';

    // Normalize primaryDiagnosis
    if (
      !parsed.primaryDiagnosis ||
      typeof parsed.primaryDiagnosis !== 'object' ||
      !parsed.primaryDiagnosis.name ||
      !parsed.primaryDiagnosis.name.trim()
    ) {
      parsed.primaryDiagnosis = null;
    } else {
      parsed.primaryDiagnosis = {
        name: String(parsed.primaryDiagnosis.name).trim(),
        icd10Code: parsed.primaryDiagnosis.icd10Code || '',
        citations: Array.isArray(parsed.primaryDiagnosis.citations) ? parsed.primaryDiagnosis.citations : []
      };
    }

    // Normalize differentials
    if (!Array.isArray(parsed.differentialDiagnoses)) {
      parsed.differentialDiagnoses = [];
    } else {
      parsed.differentialDiagnoses = parsed.differentialDiagnoses
        .filter(d => d && d.name && d.name.trim())
        .map(d => ({
          name: String(d.name).trim(),
            icd10Code: d.icd10Code || '',
            citations: Array.isArray(d.citations) ? d.citations : []
        }));
    }

    // Normalize recommended steps
    if (!Array.isArray(parsed.recommendedNextSteps)) {
      parsed.recommendedNextSteps = [];
    } else {
      parsed.recommendedNextSteps = parsed.recommendedNextSteps
        .filter(s => s && s.step && s.step.trim())
        .map(s => ({
          step: String(s.step).trim(),
          citations: Array.isArray(s.citations) ? s.citations : []
        }));
    }

    return {
      text: parsed.text,
      primaryDiagnosis: parsed.primaryDiagnosis,
      differentialDiagnoses: parsed.differentialDiagnoses,
      recommendedNextSteps: parsed.recommendedNextSteps
    };
  } catch (err) {
    console.error('parseLLMResponse error:', err.message);
    return {
      text: `I could not fully parse the model output. Based on your query: "${userMessage}" please provide any additional clinical details (onset, duration, vitals, comorbidities).`,
      primaryDiagnosis: null,
      differentialDiagnoses: [],
      recommendedNextSteps: []
    };
  }
}