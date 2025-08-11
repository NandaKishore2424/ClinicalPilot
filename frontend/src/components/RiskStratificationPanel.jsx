import React from 'react';
import { Box, Paper, Typography, Chip, LinearProgress, Tooltip } from '@mui/material';

const RISK_LEVELS = [
  { max: 25, label: 'Low', color: 'success', gradient: 'linear-gradient(90deg,#2e7d32,#43a047)' },
  { max: 55, label: 'Moderate', color: 'warning', gradient: 'linear-gradient(90deg,#ed6c02,#f9a825)' },
  { max: 80, label: 'High', color: 'error', gradient: 'linear-gradient(90deg,#d32f2f,#e53935)' },
  { max: 101, label: 'Critical', color: 'error', gradient: 'linear-gradient(90deg,#b71c1c,#ff1744)' },
];

const redFlagPatterns = [
  /chest pain/i,
  /short(ness)? of breath/i,
  /altered mental status/i,
  /sudden (weakness|vision loss|paralysis)/i,
  /seizure/i,
  /syncope/i,
  /hematemesis|melena|gi bleed/i,
  /stiff neck|meningismus/i,
  /severe abdominal pain/i,
  /airway compromise/i,
  /hypotension|shock/i
];

const urgentPhrases = [
  /emergent imaging/i,
  /immediate (referral|evaluation)/i,
  /call emergency/i,
  /urgent (ct|mri|lab)/i,
  /stabilization/i
];

function extractVitals(text) {
  const vitals = {};
  const hr = text.match(/HR[:\s]?(\d{2,3})/i);
  const bp = text.match(/BP[:\s]?(\d{2,3})\/(\d{2,3})/i);
  const rr = text.match(/RR[:\s]?(\d{2,3})/i);
  const temp = text.match(/(Temp|Temperature)[:\s]?(\d{2}\.?\d?)/i);
  if (hr) vitals.hr = +hr[1];
  if (bp) vitals.bp = { sys: +bp[1], dia: +bp[2] };
  if (rr) vitals.rr = +rr[1];
  if (temp) vitals.temp = +temp[2];
  return vitals;
}

function scoreVitals(v) {
  let s = 0;
  if (v.hr && (v.hr < 50 || v.hr > 120)) s += 12;
  if (v.rr && (v.rr < 10 || v.rr > 24)) s += 12;
  if (v.bp && (v.bp.sys < 90 || v.bp.sys > 180)) s += 15;
  if (v.temp && (v.temp >= 39.5 || v.temp < 35)) s += 10;
  return s;
}

function analyze(content, data) {
  let score = 0;
  const flags = [];
  const reasons = [];

  // Check for red flag symptoms
  redFlagPatterns.forEach(p => {
    if (p.test(content)) {
      score += 10;
      flags.push(p.source.replace(/\//g,''));
    }
  });

  // Check for urgent phrases in recommendations
  urgentPhrases.forEach(p => {
    if (p.test(content)) {
      score += 12;
      reasons.push(p.source.replace(/\//g,''));
    }
  });

  // Give weight to cardiovascular conditions
  if (data?.primaryDiagnosis?.icd10Code?.startsWith('I')) score += 6; 
  
  // More differentials suggests diagnostic uncertainty
  if (data?.differentialDiagnoses?.length >= 5) score += 5;

  // Extract and score vital signs
  const vitals = extractVitals(content);
  const vitalScore = scoreVitals(vitals);
  score += vitalScore;

  // Clip and classify
  score = Math.min(score, 100);
  const level = RISK_LEVELS.find(l => score < l.max) || RISK_LEVELS[0];

  return { score, level, flags, reasons, vitals };
}

const RiskStratificationPanel = ({ assistantContent, data }) => {
  if (!assistantContent) return null;
  const { score, level, flags, reasons, vitals } = analyze(assistantContent, data);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: 2.2,
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        borderRadius: 2,
        background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
          Risk Stratification
        </Typography>
        <Chip 
          label={`${level.label}`} 
          color={level.color === 'error' && level.label === 'Critical' ? 'error' : level.color}
          size="small"
          sx={{
            fontWeight: 600,
            background: level.gradient,
            color: '#fff'
          }}
        />
        <Tooltip title="Heuristic non-diagnostic score for prioritization only">
          <Chip
            label={`Score: ${score}`}
            size="small"
            sx={{
              ml: 1,
              fontSize: '0.65rem',
              bgcolor: 'transparent',
              border: '1px solid',
              borderColor: 'divider'
            }}
          />
        </Tooltip>
      </Box>

      <LinearProgress 
        variant="determinate" 
        value={score} 
        sx={{
          height: 8,
          borderRadius: 6,
          mb: 1.5,
          [`& .MuiLinearProgress-bar`]: { background: level.gradient }
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Automated, explainable triage signal. Not a medical decision tool.
      </Typography>

      {flags.length > 0 && (
        <Box sx={{ mb: 1.2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Triggered Flags
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
            {flags.slice(0,6).map((f, i) => (
              <Chip key={i} label={f} size="small" variant="outlined" sx={{ fontSize: '0.6rem' }} />
            ))}
          </Box>
        </Box>
      )}

      {(reasons.length > 0 || Object.keys(vitals).length > 0) && (
        <Box>
          {Object.keys(vitals).length > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              Vitals parsed: {vitals.hr && `HR ${vitals.hr} `}{vitals.bp && `BP ${vitals.bp.sys}/${vitals.bp.dia} `}{vitals.rr && `RR ${vitals.rr} `}{vitals.temp && `Temp ${vitals.temp}°C`}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default RiskStratificationPanel;