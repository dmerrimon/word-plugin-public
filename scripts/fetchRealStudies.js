/**
 * Simplified Real CT.gov Data Fetcher
 * Test the API and fetch actual studies with protocol documents
 */

const https = require('https');
const fs = require('fs').promises;

class SimpleCTGovFetcher {
  constructor() {
    this.baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  }

  /**
   * Test basic API connectivity and find studies with documents
   */
  async testAPI() {
    console.log('🔍 Testing ClinicalTrials.gov API connectivity...\n');

    try {
      // Start with a very simple query
      const simpleQuery = new URLSearchParams({
        'format': 'json',
        'pageSize': '10'
      });

      console.log('Testing basic API call...');
      const simpleResponse = await this.makeRequest(`${this.baseUrl}?${simpleQuery}`);
      const simpleData = JSON.parse(simpleResponse);
      
      console.log(`✅ Basic API works! Found ${simpleData.studies?.length || 0} studies`);
      console.log(`Total studies in database: ${simpleData.totalCount || 'unknown'}\n`);

      // Now test filtering for studies with documents
      const docQuery = new URLSearchParams({
        'filter.hasStudyDoc': 'true',
        'format': 'json',
        'pageSize': '10'
      });

      console.log('Testing document filter...');
      const docResponse = await this.makeRequest(`${this.baseUrl}?${docQuery}`);
      const docData = JSON.parse(docResponse);
      
      console.log(`✅ Document filter works! Found ${docData.studies?.length || 0} studies with documents`);
      
      if (docData.studies && docData.studies.length > 0) {
        console.log('\n📄 Sample studies with documents:');
        docData.studies.slice(0, 3).forEach((study, index) => {
          console.log(`${index + 1}. ${study.NCTId}: ${study.BriefTitle?.substring(0, 60)}...`);
        });
      }

      return true;
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      return false;
    }
  }

  /**
   * Fetch studies with specific filters
   */
  async fetchStudiesWithProtocols(condition = null, phase = null, limit = 20) {
    console.log(`\n🔎 Fetching studies${condition ? ` for ${condition}` : ''}${phase ? ` in ${phase}` : ''} with protocol documents...`);

    const query = new URLSearchParams({
      'format': 'json',
      'pageSize': limit.toString(),
      'fields': 'NCTId,BriefTitle,Phase,Condition,StudyType,EnrollmentCount,OverallStatus,StudyDocuments'
    });

    // Only add filters that work
    if (condition) {
      query.set('query.cond', condition);
    }
    
    if (phase) {
      query.set('query.phase', phase);
    }

    // Add document filter
    query.set('filter.hasStudyDoc', 'true');

    try {
      const url = `${this.baseUrl}?${query}`;
      console.log(`URL: ${url}`);
      
      const response = await this.makeRequest(url);
      const data = JSON.parse(response);
      
      const studies = data.studies || [];
      console.log(`✅ Found ${studies.length} studies with protocol documents`);
      
      // Analyze the documents
      let protocolCount = 0;
      studies.forEach(study => {
        if (study.StudyDocuments) {
          const protocolDocs = study.StudyDocuments.filter(doc => 
            doc.StudyDocumentType === 'Study Protocol'
          );
          if (protocolDocs.length > 0) {
            protocolCount++;
          }
        }
      });
      
      console.log(`📋 ${protocolCount} studies have actual protocol documents`);
      
      return studies;
    } catch (error) {
      console.error(`❌ Error fetching studies:`, error.message);
      return [];
    }
  }

  /**
   * Get detailed information about studies with protocols
   */
  async analyzeProtocolDocuments() {
    console.log('\n📊 Analyzing real protocol documents from CT.gov...\n');

    // Test different therapeutic areas
    const areas = [
      { term: 'cancer', name: 'Cancer/Oncology' },
      { term: 'diabetes', name: 'Diabetes' },
      { term: 'COVID-19', name: 'COVID-19' },
      { term: 'heart failure', name: 'Heart Failure' }
    ];

    const allStudies = [];

    for (const area of areas) {
      const studies = await this.fetchStudiesWithProtocols(area.term, null, 25);
      allStudies.push(...studies);
      
      if (studies.length > 0) {
        console.log(`\n📈 Analysis for ${area.name}:`);
        
        // Analyze phases
        const phases = {};
        studies.forEach(study => {
          if (study.Phase) {
            study.Phase.forEach(phase => {
              phases[phase] = (phases[phase] || 0) + 1;
            });
          }
        });
        console.log(`   Phases: ${Object.entries(phases).map(([p, c]) => `${p}(${c})`).join(', ')}`);
        
        // Analyze enrollment
        const enrollments = studies
          .map(s => parseInt(s.EnrollmentCount))
          .filter(e => !isNaN(e) && e > 0)
          .sort((a, b) => a - b);
        
        if (enrollments.length > 0) {
          const median = enrollments[Math.floor(enrollments.length / 2)];
          console.log(`   Enrollment: median=${median}, range=${enrollments[0]}-${enrollments[enrollments.length-1]}`);
        }
        
        // Show sample protocols
        const protocolStudies = studies.filter(s => 
          s.StudyDocuments && s.StudyDocuments.some(doc => doc.StudyDocumentType === 'Study Protocol')
        ).slice(0, 3);
        
        if (protocolStudies.length > 0) {
          console.log(`\n   📄 Sample Protocol Documents:`);
          protocolStudies.forEach((study, index) => {
            const protocolDoc = study.StudyDocuments.find(doc => doc.StudyDocumentType === 'Study Protocol');
            console.log(`   ${index + 1}. ${study.NCTId}: ${study.BriefTitle?.substring(0, 50)}...`);
            console.log(`      📎 Protocol URL: ${protocolDoc.StudyDocumentURL}`);
          });
        }
      }
      
      // Rate limiting
      await this.delay(1000);
    }

    // Generate summary
    console.log(`\n📊 REAL DATA SUMMARY:`);
    console.log(`   Total Studies Found: ${allStudies.length}`);
    
    const allPhases = {};
    const allEnrollments = [];
    let protocolDocCount = 0;
    
    allStudies.forEach(study => {
      if (study.Phase) {
        study.Phase.forEach(phase => {
          allPhases[phase] = (allPhases[phase] || 0) + 1;
        });
      }
      
      const enrollment = parseInt(study.EnrollmentCount);
      if (!isNaN(enrollment) && enrollment > 0) {
        allEnrollments.push(enrollment);
      }
      
      if (study.StudyDocuments && study.StudyDocuments.some(doc => doc.StudyDocumentType === 'Study Protocol')) {
        protocolDocCount++;
      }
    });
    
    console.log(`   Studies with Protocol PDFs: ${protocolDocCount}`);
    console.log(`   Phase Distribution: ${Object.entries(allPhases).map(([p, c]) => `${p}(${c})`).join(', ')}`);
    
    if (allEnrollments.length > 0) {
      allEnrollments.sort((a, b) => a - b);
      const median = allEnrollments[Math.floor(allEnrollments.length / 2)];
      console.log(`   Enrollment Stats: median=${median}, range=${allEnrollments[0]}-${allEnrollments[allEnrollments.length-1]}`);
    }

    // Save the real data
    await this.saveRealData(allStudies);
    
    return allStudies;
  }

  async saveRealData(studies) {
    try {
      const outputDir = './data/real_protocols';
      await fs.mkdir(outputDir, { recursive: true });
      
      const realDataFile = `${outputDir}/real_ctgov_studies.json`;
      await fs.writeFile(realDataFile, JSON.stringify({
        studies: studies,
        totalStudies: studies.length,
        collectionDate: new Date().toISOString(),
        dataSource: 'ClinicalTrials.gov API v2',
        methodology: 'Direct API queries with hasStudyDoc=true filter'
      }, null, 2));
      
      console.log(`\n💾 Real data saved to: ${realDataFile}`);
    } catch (error) {
      console.error('Error saving data:', error);
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the analysis
async function main() {
  const fetcher = new SimpleCTGovFetcher();
  
  // Test API connectivity first
  const apiWorks = await fetcher.testAPI();
  
  if (apiWorks) {
    // Analyze real protocol documents
    await fetcher.analyzeProtocolDocuments();
    
    console.log('\n🎉 Real ClinicalTrials.gov Data Analysis Complete!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Download actual protocol PDFs from the URLs found');
    console.log('   2. Parse PDF content using PDF.js or similar');
    console.log('   3. Extract real complexity metrics from protocol text');
    console.log('   4. Build genuine benchmarks from actual trial outcomes');
  } else {
    console.log('\n❌ Cannot proceed - API connectivity issues');
  }
}

if (require.main === module) {
  main();
}