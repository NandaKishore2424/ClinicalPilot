import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  Typography, 
  IconButton, 
  CircularProgress, 
  Chip, 
  Tabs, 
  Tab, 
  Tooltip, 
  Paper, 
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArticleIcon from '@mui/icons-material/Article';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const MedicalReferencePanel = ({ open, onClose, diagnosis, colorMode }) => {
  const [loading, setLoading] = useState(true);
  const [icdData, setIcdData] = useState(null);
  const [medicalData, setMedicalData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (!diagnosis || !diagnosis.icd10Code) {
      setLoading(false);
      return;
    }
    
    // Reset when a new diagnosis is selected
    setLoading(true);
    setError(null);
    
    // Simulate API call to medical database
    const fetchMedicalData = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // For demo purposes, generate data based on ICD code
        const code = diagnosis.icd10Code.trim();
        
        // Mock ICD-10 data lookup
        const icdDatabase = {
          'J45.9': {
            title: 'Asthma, unspecified',
            category: 'Respiratory',
            description: 'A chronic lung disorder characterized by recurrent breathing problems.',
            includes: ['Allergic asthma', 'Idiopathic asthma', 'Late-onset asthma'],
            excludes: ['Acute severe asthma (J46)', 'Chronic obstructive asthma (J44.9)'],
            clinicalInfo: 'Characterized by airway inflammation, wheezing, shortness of breath, and chest tightness.'
          },
          'I10': {
            title: 'Essential (primary) hypertension',
            category: 'Circulatory system',
            description: 'High blood pressure with no identifiable cause.',
            includes: ['High blood pressure', 'Hypertension (arterial) (benign) (essential)'],
            excludes: ['Hypertensive heart disease (I11)', 'Secondary hypertension (I15)'],
            clinicalInfo: 'Usually asymptomatic but can lead to headaches, shortness of breath, and nosebleeds.'
          },
          'E11.9': {
            title: 'Type 2 diabetes mellitus without complications',
            category: 'Endocrine system',
            description: 'A metabolic disorder characterized by high blood sugar due to insulin resistance.',
            includes: ['Adult-onset diabetes', 'Non-insulin-dependent diabetes'],
            excludes: ['Type 1 diabetes mellitus (E10)', 'Diabetes mellitus in pregnancy (O24)'],
            clinicalInfo: 'Symptoms include increased thirst, frequent urination, hunger, fatigue, and blurred vision.'
          },
          'K21.9': {
            title: 'Gastro-esophageal reflux disease without esophagitis',
            category: 'Digestive system',
            description: 'A condition where stomach acid flows back into the esophagus.',
            includes: ['Reflux esophagitis', 'GERD'],
            excludes: ['Reflux esophagitis with esophagitis (K21.0)'],
            clinicalInfo: 'Symptoms include heartburn, regurgitation, dysphagia, and chest pain.'
          },
          'B34.9': {
            title: 'Viral infection, unspecified',
            category: 'Infectious diseases',
            description: 'Infection caused by a virus without specified location or type.',
            includes: ['Viral infection NOS', 'Viremia NOS'],
            excludes: ['Viremia NOS (B34.9)', 'Cytomegaloviral disease (B25)'],
            clinicalInfo: 'General symptoms may include fever, fatigue, body aches, and respiratory symptoms.'
          },
          'J00': {
            title: 'Acute nasopharyngitis [common cold]',
            category: 'Respiratory',
            description: 'A viral infectious disease of the upper respiratory system.',
            includes: ['Acute rhinitis', 'Coryza (acute)', 'Nasal catarrh, acute'],
            excludes: ['Pharyngitis (J02.-)', 'Rhinitis NOS (J31.0)'],
            clinicalInfo: 'Symptoms include nasal congestion, sore throat, cough, sneezing, and mild fever.'
          },
          'J10.1': {
            title: 'Influenza with other respiratory manifestations, influenza virus identified',
            category: 'Respiratory',
            description: 'An infectious disease caused by an influenza virus with respiratory symptoms.',
            includes: ['Influenza NOS', 'Influenzal laryngitis', 'Influenzal pharyngitis'],
            excludes: ['Seasonal influenza (J10.0)', 'H1N1 influenza (J09)'],
            clinicalInfo: 'Presents with fever, chills, myalgia, cough, sore throat, and respiratory distress.'
          }
        };
        
        // Default to a generic response if the code is not in our mock database
        const icdInfo = icdDatabase[code] || {
          title: diagnosis.name,
          category: code.startsWith('A') || code.startsWith('B') ? 'Infectious' : 
                    code.startsWith('C') || code.startsWith('D') ? 'Neoplasms' :
                    code.startsWith('E') ? 'Endocrine' :
                    code.startsWith('F') ? 'Mental Disorders' :
                    code.startsWith('G') ? 'Nervous System' :
                    code.startsWith('H') ? 'Eye and Ear' :
                    code.startsWith('I') ? 'Circulatory System' :
                    code.startsWith('J') ? 'Respiratory System' :
                    code.startsWith('K') ? 'Digestive System' :
                    code.startsWith('L') ? 'Skin' :
                    code.startsWith('M') ? 'Musculoskeletal' :
                    code.startsWith('N') ? 'Genitourinary' :
                    code.startsWith('O') ? 'Pregnancy' :
                    code.startsWith('P') ? 'Perinatal' :
                    code.startsWith('Q') ? 'Congenital' :
                    code.startsWith('R') ? 'Symptoms & Signs' :
                    code.startsWith('S') || code.startsWith('T') ? 'Injury & Poisoning' :
                    code.startsWith('V') || code.startsWith('W') || code.startsWith('X') || code.startsWith('Y') ? 'External Causes' :
                    code.startsWith('Z') ? 'Factors Influencing Health' : 'Uncategorized',
          description: `Clinical condition classified as ${diagnosis.name}`,
          includes: ['Related conditions may vary'],
          excludes: ['See clinical guidelines for differential diagnoses'],
          clinicalInfo: 'Consult with healthcare provider for specific clinical information.'
        };
        
        // Mock treatment guidelines and clinical research
        const medicalLiterature = {
          guidelines: [
            {
              title: `Clinical Practice Guidelines for ${diagnosis.name}`,
              source: 'American Medical Association',
              year: '2023',
              url: '#'
            },
            {
              title: `Management of ${diagnosis.name}: Evidence-Based Approach`,
              source: 'European Medical Journal',
              year: '2022',
              url: '#'
            },
            {
              title: `${diagnosis.name} - Standard of Care`,
              source: 'International Clinical Practice',
              year: '2023',
              url: '#'
            }
          ],
          research: [
            {
              title: `Recent Advances in ${diagnosis.name} Treatment`,
              journal: 'New England Journal of Medicine',
              authors: 'Johnson et al.',
              year: '2023',
              url: '#'
            },
            {
              title: `Clinical Outcomes in ${diagnosis.name}: A Systematic Review`,
              journal: 'The Lancet',
              authors: 'Smith, Wang, and Rodriguez',
              year: '2022',
              url: '#'
            },
            {
              title: `Pathophysiology of ${diagnosis.name}`,
              journal: 'Journal of Clinical Investigation',
              authors: 'Patel and Kim',
              year: '2021',
              url: '#'
            }
          ],
          clinicalTrials: [
            {
              title: `Efficacy of New Therapy for ${diagnosis.name}`,
              status: 'Recruiting',
              phase: 'Phase III',
              identifier: 'NCT0123456789',
              url: '#'
            },
            {
              title: `${diagnosis.name} Long-term Outcomes Study`,
              status: 'Active',
              phase: 'Phase IV',
              identifier: 'NCT9876543210',
              url: '#'
            }
          ]
        };
        
        setIcdData(icdInfo);
        setMedicalData(medicalLiterature);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching medical reference data:', err);
        setError('Unable to retrieve medical reference information');
        setLoading(false);
      }
    };
    
    fetchMedicalData();
  }, [diagnosis]);
  
  // Early return if no diagnosis
  if (!diagnosis) {
    return null;
  }
  
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '90%', sm: 420, md: 480 },
          bgcolor: colorMode === 'dark' ? '#1a1a1a' : '#ffffff',
          backgroundImage: colorMode === 'dark' 
            ? 'linear-gradient(rgba(106, 66, 193, 0.03), rgba(0, 0, 0, 0))' 
            : 'none',
          height: '100%',
          p: 0,
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MedicalInformationIcon sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Medical Reference
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Diagnosis Info */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {diagnosis.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            label={diagnosis.icd10Code || 'No ICD code'}
            color="primary" 
            size="small"
            sx={{ 
              fontWeight: 600,
              mr: 1,
              bgcolor: colorMode === 'dark' ? 'rgba(106, 66, 193, 0.3)' : 'rgba(106, 66, 193, 0.1)'
            }}
          />
          {icdData && (
            <Chip 
              label={icdData.category}
              size="small"
              sx={{ 
                bgcolor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                color: 'text.secondary'
              }}
            />
          )}
        </Box>
      </Box>
      
      {/* Tabs for different information */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 56,
          }
        }}
      >
        <Tab 
          icon={<InfoIcon fontSize="small" />}
          label="Overview" 
          id="medical-tab-0"
          aria-controls="medical-tabpanel-0"
        />
        <Tab 
          icon={<LocalHospitalIcon fontSize="small" />}
          label="Clinical" 
          id="medical-tab-1"
          aria-controls="medical-tabpanel-1" 
        />
        <Tab 
          icon={<ArticleIcon fontSize="small" />}
          label="Literature" 
          id="medical-tab-2"
          aria-controls="medical-tabpanel-2"
        />
      </Tabs>
      
      {/* Tab content */}
      <Box sx={{ overflowY: 'auto', p: 0, flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            {/* Overview Tab */}
            <Box
              role="tabpanel"
              hidden={tabValue !== 0}
              id="medical-tabpanel-0"
              aria-labelledby="medical-tab-0"
              sx={{ p: 3 }}
            >
              {icdData && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {icdData.description}
                  </Typography>
                  
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Includes
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0, mb: 2 }}>
                    {icdData.includes.map((item, idx) => (
                      <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                        {item}
                      </Typography>
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Excludes
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                    {icdData.excludes.map((item, idx) => (
                      <Typography component="li" variant="body2" key={idx} sx={{ mb: 0.5 }}>
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </Box>
            
            {/* Clinical Tab */}
            <Box
              role="tabpanel"
              hidden={tabValue !== 1}
              id="medical-tabpanel-1"
              aria-labelledby="medical-tab-1"
              sx={{ p: 3 }}
            >
              {icdData && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Clinical Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {icdData.clinicalInfo}
                  </Typography>
                  
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Treatment Guidelines
                  </Typography>
                  
                  {medicalData?.guidelines.map((guideline, idx) => (
                    <Paper key={idx} elevation={0} sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: colorMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {guideline.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {guideline.source} • {guideline.year}
                      </Typography>
                      <Tooltip title="View guideline">
                        <Link href={guideline.url} underline="none" target="_blank" rel="noopener">
                          <Chip 
                            icon={<BookmarkIcon fontSize="small" />} 
                            label="Reference" 
                            size="small" 
                            clickable
                            sx={{ 
                              fontSize: '0.75rem',
                              bgcolor: colorMode === 'dark' ? 'rgba(106, 66, 193, 0.15)' : 'rgba(106, 66, 193, 0.07)',
                              color: colorMode === 'dark' ? 'primary.light' : 'primary.main',
                            }} 
                          />
                        </Link>
                      </Tooltip>
                    </Paper>
                  ))}
                  
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                    Clinical Trials
                  </Typography>
                  {medicalData?.clinicalTrials.map((trial, idx) => (
                    <Paper key={idx} elevation={0} sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: colorMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {trial.title}
                      </Typography>
                      <Box sx={{ display: 'flex', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label={trial.status} 
                          size="small" 
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: trial.status === 'Recruiting' ? 
                              colorMode === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)' : 
                              colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            color: trial.status === 'Recruiting' ? 
                              colorMode === 'dark' ? '#81c784' : '#2e7d32' : 'text.secondary'
                          }} 
                        />
                        <Chip 
                          label={trial.phase} 
                          size="small" 
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            color: 'text.secondary'
                          }} 
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                          {trial.identifier}
                        </Typography>
                      </Box>
                      <Link href={trial.url} underline="hover" variant="caption" target="_blank" rel="noopener">
                        View trial details
                      </Link>
                    </Paper>
                  ))}
                </>
              )}
            </Box>
            
            {/* Literature Tab */}
            <Box
              role="tabpanel"
              hidden={tabValue !== 2}
              id="medical-tabpanel-2"
              aria-labelledby="medical-tab-2"
              sx={{ p: 3 }}
            >
              {medicalData && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Recent Research
                  </Typography>
                  
                  {medicalData.research.map((paper, idx) => (
                    <Paper key={idx} elevation={0} sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: colorMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {paper.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {paper.authors} • {paper.journal} • {paper.year}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Link href={paper.url} underline="hover" variant="caption" target="_blank" rel="noopener">
                          View publication
                        </Link>
                      </Box>
                    </Paper>
                  ))}
                  
                  <Box sx={{ 
                    p: 2, 
                    mt: 2, 
                    borderRadius: 2, 
                    bgcolor: colorMode === 'dark' ? 'rgba(106, 66, 193, 0.08)' : 'rgba(106, 66, 193, 0.04)'
                  }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      Note: Medical literature is provided for reference purposes only. 
                      Always refer to the latest clinical guidelines and consult with 
                      appropriate healthcare professionals.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default MedicalReferencePanel;