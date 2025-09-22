/**
 * ClinicalTrials.gov Data Collector
 * Systematically collects structured data from all completed clinical trials
 * Uses the free public API to build comprehensive knowledge base
 */

export interface ClinicalTrialRecord {
  // Basic Study Information
  nctId: string;
  title: string;
  briefSummary: string;
  detailedDescription?: string;
  
  // Study Design
  studyType: string;
  phase?: string[];
  allocation?: string;
  interventionModel?: string;
  masking?: string;
  primaryPurpose?: string;
  
  // Enrollment and Status
  enrollmentCount?: number;
  enrollmentType?: string;
  overallStatus: string;
  studyFirstSubmitted: string;
  studyFirstPosted: string;
  lastUpdateSubmitted: string;
  completionDate?: string;
  
  // Eligibility Criteria (CRITICAL for our analysis)
  eligibilityModule: {
    eligibilityCriteria?: string;
    healthyVolunteers?: boolean;
    gender?: string;
    minimumAge?: string;
    maximumAge?: string;
    standardAges?: string[];
  };
  
  // Interventions
  interventions: ClinicalTrialIntervention[];
  
  // Primary and Secondary Outcomes
  primaryOutcomes: ClinicalTrialOutcome[];
  secondaryOutcomes: ClinicalTrialOutcome[];
  
  // Study Arms
  arms?: ClinicalTrialArm[];
  
  // Conditions and Keywords
  conditions: string[];
  keywords?: string[];
  meshTerms?: string[];
  
  // Sponsor Information
  leadSponsor: {
    name: string;
    class: string;
  };
  collaborators?: Array<{
    name: string;
    class: string;
  }>;
  
  // Site Information
  locations?: ClinicalTrialLocation[];
  
  // Study Documents
  studyDocuments?: Array<{
    type: string;
    url?: string;
    comment?: string;
  }>;
  
  // Results (if available)
  hasResults: boolean;
  resultsFirstSubmitted?: string;
}

export interface ClinicalTrialIntervention {
  type: string;
  name: string;
  description?: string;
  armGroupLabels?: string[];
  otherNames?: string[];
}

export interface ClinicalTrialOutcome {
  measure: string;
  description?: string;
  timeFrame?: string;
}

export interface ClinicalTrialArm {
  label: string;
  type?: string;
  description?: string;
  interventionNames?: string[];
}

export interface ClinicalTrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
}

export interface CollectionProgress {
  totalTrials: number;
  processedTrials: number;
  failedTrials: number;
  currentBatch: number;
  estimatedTimeRemaining: string;
  lastProcessedNCT: string;
}

export class ClinicalTrialsDataCollector {
  private static readonly BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';
  private static readonly BATCH_SIZE = 100; // API supports up to 1000
  private static readonly DELAY_BETWEEN_REQUESTS = 100; // ms to respect rate limits
  
  /**
   * Collect all completed clinical trials from ClinicalTrials.gov
   */
  static async collectAllCompletedTrials(
    onProgress?: (progress: CollectionProgress) => void,
    onTrialProcessed?: (trial: ClinicalTrialRecord) => void
  ): Promise<ClinicalTrialRecord[]> {
    console.log('🚀 Starting comprehensive ClinicalTrials.gov data collection...');
    
    const allTrials: ClinicalTrialRecord[] = [];
    let pageToken: string | null = null;
    let totalProcessed = 0;
    let totalFailed = 0;
    let batchNumber = 0;
    
    try {
      // First, get the total count of completed trials
      const totalCount = await this.getTotalCompletedTrialsCount();
      console.log(`📊 Found ${totalCount} completed trials to process`);
      
      do {
        batchNumber++;
        console.log(`📦 Processing batch ${batchNumber}...`);
        
        try {
          const batchResult: any = await this.fetchTrialsBatch(pageToken);
          
          for (const studyData of batchResult.studies) {
            try {
              const trial = this.parseTrialData(studyData);
              allTrials.push(trial);
              totalProcessed++;
              
              // Call progress callbacks
              onTrialProcessed?.(trial);
              onProgress?.({
                totalTrials: totalCount,
                processedTrials: totalProcessed,
                failedTrials: totalFailed,
                currentBatch: batchNumber,
                estimatedTimeRemaining: this.calculateETA(totalProcessed, totalCount, Date.now()),
                lastProcessedNCT: trial.nctId
              });
              
            } catch (parseError) {
              console.error(`❌ Failed to parse trial:`, parseError);
              totalFailed++;
            }
          }
          
          pageToken = batchResult.nextPageToken;
          
          // Rate limiting delay
          if (pageToken) {
            await this.delay(this.DELAY_BETWEEN_REQUESTS);
          }
          
        } catch (batchError) {
          console.error(`❌ Failed to fetch batch ${batchNumber}:`, batchError);
          totalFailed += this.BATCH_SIZE;
        }
        
      } while (pageToken);
      
      console.log(`✅ Collection complete! Processed ${totalProcessed} trials, ${totalFailed} failed`);
      return allTrials;
      
    } catch (error) {
      console.error('❌ Critical error in data collection:', error);
      throw error;
    }
  }
  
  /**
   * Get total count of completed trials
   */
  private static async getTotalCompletedTrialsCount(): Promise<number> {
    const url = `${this.BASE_URL}?query.cond=&query.term=&query.locn=&query.titles=&query.intr=&filter.overallStatus=COMPLETED&pageSize=1&format=json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get trial count: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.totalCount || 0;
  }
  
  /**
   * Fetch a batch of trials
   */
  private static async fetchTrialsBatch(pageToken?: string | null): Promise<any> {
    let url = `${this.BASE_URL}?query.cond=&query.term=&query.locn=&query.titles=&query.intr=&filter.overallStatus=COMPLETED&pageSize=${this.BATCH_SIZE}&format=json&fields=NCTId,BriefTitle,BriefSummary,DetailedDescription,Phase,StudyType,Condition,InterventionName,PrimaryOutcomeMeasure,SecondaryOutcomeMeasure,EnrollmentCount,StudyFirstSubmittedDate,CompletionDate,OverallStatus,EligibilityCriteria,MinimumAge,MaximumAge,Gender,HealthyVolunteers,LeadSponsorName,LeadSponsorClass,LocationFacility,LocationCity,LocationState,LocationCountry,InterventionType,InterventionDescription,ArmGroupLabel,ArmGroupType,ArmGroupDescription`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Parse raw trial data from API into our structured format
   */
  private static parseTrialData(studyData: any): ClinicalTrialRecord {
    const protocolSection = studyData.protocolSection || {};
    const identificationModule = protocolSection.identificationModule || {};
    const statusModule = protocolSection.statusModule || {};
    const designModule = protocolSection.designModule || {};
    const eligibilityModule = protocolSection.eligibilityModule || {};
    const armsInterventionsModule = protocolSection.armsInterventionsModule || {};
    const outcomesModule = protocolSection.outcomesModule || {};
    const conditionsModule = protocolSection.conditionsModule || {};
    const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};
    const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
    
    return {
      // Basic Information
      nctId: identificationModule.nctId || '',
      title: identificationModule.briefTitle || '',
      briefSummary: identificationModule.briefSummary || '',
      detailedDescription: identificationModule.detailedDescription,
      
      // Study Design
      studyType: designModule.studyType || '',
      phase: designModule.phases || [],
      allocation: designModule.designInfo?.allocation,
      interventionModel: designModule.designInfo?.interventionModel,
      masking: designModule.designInfo?.maskingInfo?.masking,
      primaryPurpose: designModule.designInfo?.primaryPurpose,
      
      // Enrollment and Status
      enrollmentCount: designModule.enrollmentInfo?.count,
      enrollmentType: designModule.enrollmentInfo?.type,
      overallStatus: statusModule.overallStatus || '',
      studyFirstSubmitted: statusModule.studyFirstSubmittedDate || '',
      studyFirstPosted: statusModule.studyFirstPostDate || '',
      lastUpdateSubmitted: statusModule.lastUpdateSubmittedDate || '',
      completionDate: statusModule.completionDateStruct?.date,
      
      // Eligibility Criteria - CRITICAL for our analysis
      eligibilityModule: {
        eligibilityCriteria: eligibilityModule.eligibilityCriteria,
        healthyVolunteers: eligibilityModule.healthyVolunteers,
        gender: eligibilityModule.sex,
        minimumAge: eligibilityModule.minimumAge,
        maximumAge: eligibilityModule.maximumAge,
        standardAges: eligibilityModule.stdAges || []
      },
      
      // Interventions
      interventions: (armsInterventionsModule.interventions || []).map((intervention: any) => ({
        type: intervention.type || '',
        name: intervention.name || '',
        description: intervention.description,
        armGroupLabels: intervention.armGroupLabels || [],
        otherNames: intervention.otherNames || []
      })),
      
      // Outcomes
      primaryOutcomes: (outcomesModule.primaryOutcomes || []).map((outcome: any) => ({
        measure: outcome.measure || '',
        description: outcome.description,
        timeFrame: outcome.timeFrame
      })),
      
      secondaryOutcomes: (outcomesModule.secondaryOutcomes || []).map((outcome: any) => ({
        measure: outcome.measure || '',
        description: outcome.description,
        timeFrame: outcome.timeFrame
      })),
      
      // Study Arms
      arms: (armsInterventionsModule.armGroups || []).map((arm: any) => ({
        label: arm.label || '',
        type: arm.type,
        description: arm.description,
        interventionNames: arm.interventionNames || []
      })),
      
      // Conditions
      conditions: conditionsModule.conditions || [],
      keywords: conditionsModule.keywords || [],
      
      // Sponsor Information
      leadSponsor: {
        name: sponsorCollaboratorsModule.leadSponsor?.name || '',
        class: sponsorCollaboratorsModule.leadSponsor?.class || ''
      },
      
      collaborators: (sponsorCollaboratorsModule.collaborators || []).map((collab: any) => ({
        name: collab.name || '',
        class: collab.class || ''
      })),
      
      // Locations
      locations: (contactsLocationsModule.locations || []).map((location: any) => ({
        facility: location.facility,
        city: location.city,
        state: location.state,
        country: location.country,
        status: location.status
      })),
      
      // Results availability
      hasResults: !!studyData.hasResults,
      resultsFirstSubmitted: studyData.resultsFirstSubmittedDate
    };
  }
  
  /**
   * Calculate estimated time remaining
   */
  private static calculateETA(processed: number, total: number, startTime: number): string {
    if (processed === 0) return 'Calculating...';
    
    const elapsed = Date.now() - startTime;
    const rate = processed / elapsed; // trials per ms
    const remaining = total - processed;
    const etaMs = remaining / rate;
    
    const hours = Math.floor(etaMs / (1000 * 60 * 60));
    const minutes = Math.floor((etaMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
  
  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Save collected data to local storage or file
   */
  static async saveTrialsData(trials: ClinicalTrialRecord[], filename?: string): Promise<void> {
    const data = {
      collectedAt: new Date().toISOString(),
      totalTrials: trials.length,
      trials: trials
    };
    
    // For browser environment, use localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clinicalTrialsData', JSON.stringify(data));
        console.log(`✅ Saved ${trials.length} trials to localStorage`);
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
      }
    }
    
    // Also create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `clinical-trials-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`💾 Created downloadable file: ${a.download}`);
  }
  
  /**
   * Load previously collected data
   */
  static loadTrialsData(): ClinicalTrialRecord[] | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('clinicalTrialsData');
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      console.log(`📂 Loaded ${data.trials?.length || 0} trials from storage (collected: ${data.collectedAt})`);
      return data.trials || [];
    } catch (error) {
      console.error('❌ Failed to load trials data:', error);
      return null;
    }
  }
}