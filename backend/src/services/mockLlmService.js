// Create this new file for a mock implementation

exports.processClinicalQuery = async (message, imageUrl, conversationHistory) => {
  console.log('Using mock LLM service');
  console.log('Message:', message);
  console.log('Image URL:', imageUrl);
  console.log('Conversation history length:', conversationHistory.length);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock structured response
  return {
    text: `I've analyzed your query about "${message}". Here's what I found:`,
    primaryDiagnosis: {
      name: "Acute Viral Fever",
      icd10Code: "B34.9"
    },
    differentialDiagnoses: [
      {
        name: "Common Cold",
        icd10Code: "J00"
      },
      {
        name: "Seasonal Influenza",
        icd10Code: "J10.1"
      }
    ],
    recommendedNextSteps: [
      {
        step: "Rest and hydration"
      },
      {
        step: "Monitor temperature every 4 hours"
      },
      {
        step: "Take acetaminophen for fever as needed"
      }
    ]
  };
};