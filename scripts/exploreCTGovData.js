/**
 * Explore the actual structure of ClinicalTrials.gov API v2 data
 */

const https = require('https');
const fs = require('fs').promises;

class CTGovExplorer {
  constructor() {
    this.baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  }

  async exploreDataStructure() {
    console.log('🔍 Exploring ClinicalTrials.gov API v2 data structure...\n');

    try {
      // Get a single study to understand the structure
      const response = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=1`);
      const data = JSON.parse(response);
      
      if (data.studies && data.studies.length > 0) {
        const study = data.studies[0];
        console.log('📊 Top-level structure:');
        console.log(Object.keys(study));
        
        console.log('\n📋 Protocol Section structure:');
        if (study.protocolSection) {
          this.exploreObject(study.protocolSection, '  ');
        }
        
        console.log('\n📈 Derived Section structure:');
        if (study.derivedSection) {
          this.exploreObject(study.derivedSection, '  ');
        }
        
        // Save full structure for analysis
        await this.saveStructureAnalysis(study);
        
        // Now look for document-related fields
        console.log('\n🔍 Looking for document-related fields...');
        this.findDocumentFields(study, '');
        
        // Try to find studies with documents by looking deeper
        await this.findStudiesWithDocuments();
      }
      
    } catch (error) {
      console.error('❌ Error exploring data:', error.message);
    }
  }

  exploreObject(obj, indent = '') {
    if (typeof obj !== 'object' || obj === null) return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      console.log(`${indent}${key}: ${Array.isArray(value) ? `[Array(${value.length})]` : typeof value}`);
      
      if (key.toLowerCase().includes('doc') || key.toLowerCase().includes('document')) {
        console.log(`${indent}  🔍 DOCUMENT FIELD FOUND: ${key}`, typeof value);
        if (Array.isArray(value) && value.length > 0) {
          console.log(`${indent}    Sample content:`, value[0]);
        }
      }
    });
  }

  findDocumentFields(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key.toLowerCase().includes('doc') || key.toLowerCase().includes('document')) {
        console.log(`📄 Found document field: ${currentPath}`);
        console.log(`   Type: ${Array.isArray(value) ? `Array(${value.length})` : typeof value}`);
        if (value && typeof value === 'object') {
          console.log(`   Content:`, JSON.stringify(value, null, 2).substring(0, 200) + '...');
        }
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.findDocumentFields(value, currentPath);
      }
    });
  }

  async findStudiesWithDocuments() {
    console.log('\n🔎 Searching for studies with actual documents...');
    
    // Search in different therapeutic areas to increase chances of finding documented studies
    const searches = [
      'cancer',
      'COVID-19', 
      'diabetes',
      'vaccine'
    ];
    
    for (const search of searches) {
      console.log(`\n   Searching ${search} studies...`);
      
      try {
        const response = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=20&query.cond=${search}`);
        const data = JSON.parse(response);
        
        if (data.studies) {
          console.log(`   Found ${data.studies.length} ${search} studies`);
          
          let documentsFound = 0;
          
          data.studies.forEach((study, index) => {
            const hasDocuments = this.checkForDocuments(study);
            if (hasDocuments) {
              documentsFound++;
              console.log(`   📋 Study ${index + 1} has documents!`);
            }
          });
          
          console.log(`   Studies with documents: ${documentsFound}/${data.studies.length}`);
          
          if (documentsFound > 0) {
            // Save a sample documented study for analysis
            const documentedStudy = data.studies.find(study => this.checkForDocuments(study));
            if (documentedStudy) {
              await this.saveStudyExample(documentedStudy, `${search}_documented_study.json`);
            }
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error searching ${search}:`, error.message);
      }
    }
  }

  checkForDocuments(study) {
    // Recursively check for any document-related data
    return this.hasDocumentFields(study);
  }

  hasDocumentFields(obj, depth = 0) {
    if (depth > 5 || typeof obj !== 'object' || obj === null) return false;
    
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase().includes('doc') || key.toLowerCase().includes('document')) {
        const value = obj[key];
        if (Array.isArray(value) && value.length > 0) {
          return true;
        }
        if (typeof value === 'object' && value !== null) {
          return true;
        }
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.hasDocumentFields(obj[key], depth + 1)) {
          return true;
        }
      }
    }
    
    return false;
  }

  async saveStructureAnalysis(study) {
    try {
      const outputDir = './data/api_analysis';
      await fs.mkdir(outputDir, { recursive: true });
      
      const analysisFile = `${outputDir}/ctgov_structure_analysis.json`;
      await fs.writeFile(analysisFile, JSON.stringify({
        analysisDate: new Date().toISOString(),
        apiVersion: 'v2',
        sampleStudy: study,
        topLevelFields: Object.keys(study),
        protocolSectionFields: study.protocolSection ? Object.keys(study.protocolSection) : [],
        derivedSectionFields: study.derivedSection ? Object.keys(study.derivedSection) : []
      }, null, 2));
      
      console.log(`💾 Structure analysis saved to: ${analysisFile}`);
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  async saveStudyExample(study, filename) {
    try {
      const outputDir = './data/api_analysis';
      await fs.mkdir(outputDir, { recursive: true });
      
      const exampleFile = `${outputDir}/${filename}`;
      await fs.writeFile(exampleFile, JSON.stringify(study, null, 2));
      
      console.log(`💾 Study example saved to: ${exampleFile}`);
    } catch (error) {
      console.error('Error saving study example:', error);
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
        
      }).on('error', reject);
    });
  }
}

// Run the exploration
async function main() {
  const explorer = new CTGovExplorer();
  await explorer.exploreDataStructure();
  
  console.log('\n🎉 CT.gov API exploration complete!');
  console.log('📁 Check ./data/api_analysis/ for detailed structure analysis');
}

if (require.main === module) {
  main();
}