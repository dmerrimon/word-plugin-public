/**
 * Test ClinicalTrials.gov API to understand available parameters
 */

const https = require('https');

class CTGovAPITester {
  constructor() {
    this.baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  }

  async testBasicAPI() {
    console.log('🔍 Testing basic ClinicalTrials.gov API...\n');

    try {
      // Test 1: Most basic query possible
      console.log('Test 1: Basic query');
      const basic = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=5`);
      const basicData = JSON.parse(basic);
      console.log(`✅ Success: Found ${basicData.studies?.length || 0} studies`);
      
      if (basicData.studies && basicData.studies.length > 0) {
        console.log('Sample study fields:', Object.keys(basicData.studies[0]));
      }

      // Test 2: Try with fields parameter
      console.log('\nTest 2: With specific fields');
      const fielded = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=5&fields=NCTId,BriefTitle`);
      const fieldedData = JSON.parse(fielded);
      console.log(`✅ Success: Found ${fieldedData.studies?.length || 0} studies with specific fields`);

      // Test 3: Try condition search
      console.log('\nTest 3: Search by condition');
      const conditionSearch = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=5&query.cond=cancer`);
      const conditionData = JSON.parse(conditionSearch);
      console.log(`✅ Success: Found ${conditionData.studies?.length || 0} cancer studies`);

      // Test 4: Try to find studies with any documents
      console.log('\nTest 4: Looking for studies with documents...');
      
      // First, let's see what fields are available
      const fullFieldsStudy = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=1`);
      const fullData = JSON.parse(fullFieldsStudy);
      
      if (fullData.studies && fullData.studies.length > 0) {
        console.log('Available fields in study data:');
        console.log(Object.keys(fullData.studies[0]).sort().join(', '));
        
        // Check if this study has documents
        const study = fullData.studies[0];
        if (study.StudyDocuments) {
          console.log(`\n📄 Study ${study.NCTId} has documents:`, study.StudyDocuments.length);
          if (study.StudyDocuments.length > 0) {
            console.log('Document types:', study.StudyDocuments.map(d => d.StudyDocumentType));
          }
        } else {
          console.log(`Study ${study.NCTId} has no StudyDocuments field`);
        }
      }

      // Test 5: Try different approaches to find documents
      console.log('\nTest 5: Different approaches to find documented studies...');
      
      const approaches = [
        'query.studyDoc=Study Protocol',
        'filter.studyDoc=Study Protocol', 
        'query.hasStudyDoc=true',
        'filter.hasStudyDoc=true'
      ];
      
      for (const approach of approaches) {
        try {
          console.log(`Trying: ${approach}`);
          const testUrl = `${this.baseUrl}?format=json&pageSize=5&${approach}`;
          const response = await this.makeRequest(testUrl);
          const data = JSON.parse(response);
          console.log(`  ✅ Success: Found ${data.studies?.length || 0} studies`);
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);
        }
      }

      // Test 6: Manual search for studies with documents
      console.log('\nTest 6: Manual search for studies with documents...');
      const manualSearch = await this.makeRequest(`${this.baseUrl}?format=json&pageSize=50&fields=NCTId,BriefTitle,StudyDocuments`);
      const manualData = JSON.parse(manualSearch);
      
      let studiesWithDocs = 0;
      let studiesWithProtocols = 0;
      
      if (manualData.studies) {
        manualData.studies.forEach(study => {
          if (study.StudyDocuments && study.StudyDocuments.length > 0) {
            studiesWithDocs++;
            
            const hasProtocol = study.StudyDocuments.some(doc => 
              doc.StudyDocumentType === 'Study Protocol'
            );
            
            if (hasProtocol) {
              studiesWithProtocols++;
              console.log(`📋 ${study.NCTId}: Has protocol document`);
            }
          }
        });
      }
      
      console.log(`\n📊 Results from manual search (50 studies):`);
      console.log(`   Studies with any documents: ${studiesWithDocs}`);
      console.log(`   Studies with protocol documents: ${studiesWithProtocols}`);

      return true;
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      return false;
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      console.log(`   Request: ${url}`);
      
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

// Run the test
async function main() {
  const tester = new CTGovAPITester();
  await tester.testBasicAPI();
}

if (require.main === module) {
  main();
}