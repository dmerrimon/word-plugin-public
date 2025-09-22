/**
 * Therapeutic Area Selector
 * Allows users to specify exact therapeutic area and indication for precise analysis
 */

import * as React from 'react';

export interface TherapeuticAreaSelection {
  primaryArea: string;
  indication: string;
  subtype?: string;
  targetPopulation?: string;
}

export interface TherapeuticAreaSelectorProps {
  selection: TherapeuticAreaSelection;
  onSelectionChange: (selection: TherapeuticAreaSelection) => void;
}

interface TherapeuticAreaData {
  label: string;
  indications: {
    [key: string]: {
      label: string;
      subtypes: string[];
    };
  };
}

interface TherapeuticAreasConfig {
  [key: string]: TherapeuticAreaData;
}

export const TherapeuticAreaSelector: React.FC<TherapeuticAreaSelectorProps> = ({
  selection,
  onSelectionChange
}) => {
  // Comprehensive therapeutic area taxonomy based on real ClinicalTrials.gov data
  const therapeuticAreas: TherapeuticAreasConfig = {
    'oncology': {
      label: 'Oncology',
      indications: {
        'lung_cancer': {
          label: 'Lung Cancer',
          subtypes: ['NSCLC - EGFR+', 'NSCLC - ALK+', 'NSCLC - KRAS+', 'NSCLC - PD-L1+', 'SCLC', 'Mesothelioma']
        },
        'breast_cancer': {
          label: 'Breast Cancer', 
          subtypes: ['HR+/HER2-', 'HER2+', 'Triple Negative', 'Inflammatory', 'Metastatic']
        },
        'colorectal_cancer': {
          label: 'Colorectal Cancer',
          subtypes: ['MSI-H', 'MSS', 'KRAS Wild-type', 'BRAF+', 'Metastatic']
        },
        'prostate_cancer': {
          label: 'Prostate Cancer',
          subtypes: ['Castration Resistant', 'Hormone Sensitive', 'Metastatic', 'Localized']
        },
        'melanoma': {
          label: 'Melanoma',
          subtypes: ['BRAF+', 'BRAF Wild-type', 'Mucosal', 'Uveal', 'Advanced']
        },
        'hematologic': {
          label: 'Hematologic Malignancies',
          subtypes: ['AML', 'ALL', 'CLL', 'Multiple Myeloma', 'Lymphoma - DLBCL', 'Lymphoma - FL', 'CML']
        },
        'other_solid_tumors': {
          label: 'Other Solid Tumors',
          subtypes: ['Pancreatic', 'Ovarian', 'Renal Cell', 'Hepatocellular', 'Gastric', 'Head & Neck']
        }
      }
    },
    'cardiology': {
      label: 'Cardiology',
      indications: {
        'heart_failure': {
          label: 'Heart Failure',
          subtypes: ['HFrEF', 'HFpEF', 'Acute Decompensated', 'Chronic Stable']
        },
        'coronary_artery_disease': {
          label: 'Coronary Artery Disease',
          subtypes: ['STEMI', 'NSTEMI', 'Stable Angina', 'Post-PCI']
        },
        'arrhythmias': {
          label: 'Arrhythmias',
          subtypes: ['Atrial Fibrillation', 'Ventricular Tachycardia', 'Bradycardia', 'SVT']
        },
        'hypertension': {
          label: 'Hypertension',
          subtypes: ['Essential HTN', 'Resistant HTN', 'Pulmonary HTN', 'Secondary HTN']
        },
        'lipid_disorders': {
          label: 'Lipid Disorders',
          subtypes: ['Familial Hypercholesterolemia', 'Mixed Dyslipidemia', 'Hypertriglyceridemia']
        }
      }
    },
    'neurology': {
      label: 'Neurology',
      indications: {
        'alzheimers_disease': {
          label: "Alzheimer's Disease",
          subtypes: ['Mild Cognitive Impairment', 'Mild Dementia', 'Moderate Dementia', 'Early-onset']
        },
        'parkinsons_disease': {
          label: "Parkinson's Disease", 
          subtypes: ['Early Stage', 'Advanced', 'Levodopa-induced Dyskinesia', 'Motor Fluctuations']
        },
        'multiple_sclerosis': {
          label: 'Multiple Sclerosis',
          subtypes: ['Relapsing-Remitting', 'Primary Progressive', 'Secondary Progressive']
        },
        'epilepsy': {
          label: 'Epilepsy',
          subtypes: ['Focal Seizures', 'Generalized Seizures', 'Drug-Resistant', 'Pediatric']
        },
        'stroke': {
          label: 'Stroke',
          subtypes: ['Acute Ischemic', 'Hemorrhagic', 'Secondary Prevention', 'Recovery']
        },
        'migraine': {
          label: 'Migraine',
          subtypes: ['Episodic', 'Chronic', 'Prevention', 'Acute Treatment']
        }
      }
    },
    'infectious_disease': {
      label: 'Infectious Disease',
      indications: {
        'bacterial_infections': {
          label: 'Bacterial Infections',
          subtypes: ['MRSA', 'VRE', 'Gram-negative MDR', 'C. difficile', 'Pneumonia', 'UTI']
        },
        'viral_infections': {
          label: 'Viral Infections',
          subtypes: ['Influenza', 'RSV', 'Hepatitis B', 'Hepatitis C', 'HIV', 'COVID-19']
        },
        'fungal_infections': {
          label: 'Fungal Infections',
          subtypes: ['Invasive Aspergillosis', 'Candidiasis', 'Cryptococcosis', 'Endemic Mycoses']
        },
        'sepsis': {
          label: 'Sepsis',
          subtypes: ['Severe Sepsis', 'Septic Shock', 'Healthcare-associated', 'Community-acquired']
        }
      }
    },
    'endocrinology': {
      label: 'Endocrinology',
      indications: {
        'diabetes': {
          label: 'Diabetes',
          subtypes: ['Type 1', 'Type 2', 'Gestational', 'MODY', 'Post-transplant']
        },
        'obesity': {
          label: 'Obesity',
          subtypes: ['BMI >30', 'BMI >35', 'Pediatric', 'Post-bariatric']
        },
        'thyroid_disorders': {
          label: 'Thyroid Disorders',
          subtypes: ['Hypothyroidism', 'Hyperthyroidism', 'Thyroid Cancer', 'Goiter']
        },
        'osteoporosis': {
          label: 'Osteoporosis',
          subtypes: ['Postmenopausal', 'Male', 'Glucocorticoid-induced', 'Secondary']
        }
      }
    },
    'psychiatry': {
      label: 'Psychiatry',
      indications: {
        'depression': {
          label: 'Depression',
          subtypes: ['Major Depressive Disorder', 'Treatment-Resistant', 'Bipolar Depression', 'Postpartum']
        },
        'anxiety_disorders': {
          label: 'Anxiety Disorders',
          subtypes: ['Generalized Anxiety', 'Social Anxiety', 'Panic Disorder', 'PTSD']
        },
        'schizophrenia': {
          label: 'Schizophrenia',
          subtypes: ['First Episode', 'Treatment-Resistant', 'Schizoaffective', 'Cognitive Symptoms']
        },
        'adhd': {
          label: 'ADHD',
          subtypes: ['Pediatric', 'Adult', 'Inattentive Type', 'Hyperactive Type']
        }
      }
    }
  };

  const targetPopulations = [
    'Adult (18-65)',
    'Elderly (>65)',
    'Pediatric (2-17)',
    'Adolescent (12-17)',
    'Young Adult (18-39)',
    'All Ages',
    'Treatment-Naive',
    'Treatment-Experienced',
    'Refractory/Resistant',
    'First-line',
    'Second-line+',
    'Maintenance'
  ];

  const handlePrimaryAreaChange = (area: string) => {
    onSelectionChange({
      primaryArea: area,
      indication: '',
      subtype: '',
      targetPopulation: selection.targetPopulation
    });
  };

  const handleIndicationChange = (indication: string) => {
    onSelectionChange({
      ...selection,
      indication,
      subtype: ''
    });
  };

  const handleSubtypeChange = (subtype: string) => {
    onSelectionChange({
      ...selection,
      subtype
    });
  };

  const handleTargetPopulationChange = (population: string) => {
    onSelectionChange({
      ...selection,
      targetPopulation: population
    });
  };

  const currentArea = selection.primaryArea ? therapeuticAreas[selection.primaryArea as keyof typeof therapeuticAreas] : null;
  const currentIndication = (currentArea?.indications && selection.indication) ? 
    currentArea.indications[selection.indication as keyof typeof currentArea.indications] : null;

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <h4 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '700',
        color: '#1e293b'
      }}>
        🎯 Specify Your Protocol for Precise Analysis
      </h4>
      
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
        Select your exact therapeutic area and indication for comparison against similar protocols in our database.
      </div>

      {/* Primary Therapeutic Area */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Primary Therapeutic Area:
        </label>
        <select
          value={selection.primaryArea}
          onChange={(e) => handlePrimaryAreaChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Select therapeutic area...</option>
          {Object.entries(therapeuticAreas).map(([key, area]) => (
            <option key={key} value={key}>{area.label}</option>
          ))}
        </select>
      </div>

      {/* Indication */}
      {currentArea && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Specific Indication:
          </label>
          <select
            value={selection.indication}
            onChange={(e) => handleIndicationChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select indication...</option>
            {Object.entries(currentArea.indications).map(([key, indication]) => (
              <option key={key} value={key}>{indication.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Subtype */}
      {currentIndication && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Subtype/Biomarker:
          </label>
          <select
            value={selection.subtype || ''}
            onChange={(e) => handleSubtypeChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Select subtype...</option>
            {(currentIndication && 'subtypes' in currentIndication ? currentIndication.subtypes : []).map((subtype: string) => (
              <option key={subtype} value={subtype}>{subtype}</option>
            ))}
          </select>
        </div>
      )}

      {/* Target Population */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Target Population:
        </label>
        <select
          value={selection.targetPopulation || ''}
          onChange={(e) => handleTargetPopulationChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}
        >
          <option value="">Select population...</option>
          {targetPopulations.map((pop) => (
            <option key={pop} value={pop}>{pop}</option>
          ))}
        </select>
      </div>

      {/* Selection Summary */}
      {selection.primaryArea && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #d1fae5',
          borderRadius: '4px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#065f46', marginBottom: '2px' }}>
            Selected for Analysis:
          </div>
          <div style={{ fontSize: '11px', color: '#047857' }}>
            {currentArea?.label}
            {currentIndication && 'label' in currentIndication && ` → ${currentIndication.label}`}
            {selection.subtype && ` → ${selection.subtype}`}
            {selection.targetPopulation && ` • ${selection.targetPopulation}`}
          </div>
        </div>
      )}
    </div>
  );
};