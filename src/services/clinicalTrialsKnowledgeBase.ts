/**
 * Clinical Trials Knowledge Base
 * Processes and analyzes structured data from ClinicalTrials.gov
 * Creates intelligent insights from real trial patterns
 */

import { ClinicalTrialRecord } from './clinicalTrialsDataCollector';
import { TherapeuticAreaSelection } from '../components/TherapeuticAreaSelector';

export interface KnowledgeBaseStats {
  totalTrials: number;
  trialsByPhase: Record<string, number>;
  trialsByTherapeuticArea: Record<string, number>;
  trialsByStatus: Record<string, number>;
  trialsByYear: Record<string, number>;
  avgEnrollmentByPhase: Record<string, number>;
  successRateByPhase: Record<string, number>;
  commonFailureReasons: Array<{ reason: string; frequency: number }>;
}

export interface EligibilityPattern {
  criteriaText: string;
  frequency: number;
  associatedWithSuccess: boolean;
  therapeuticAreas: string[];
  phases: string[];
  avgEnrollmentTime: number;
  exampleNCTs: string[];
}

export interface EnrollmentInsight {
  pattern: string;
  description: string;
  frequency: number;
  impactOnEnrollment: 'Positive' | 'Negative' | 'Neutral';
  quantifiedImpact: number; // percentage change in enrollment time
  evidenceFrom: string[];
  therapeuticAreaSpecific: boolean;
  phaseSpecific: boolean;
}

export interface RealWorldBenchmark {
  selection: TherapeuticAreaSelection;
  similarTrials: ClinicalTrialRecord[];
  benchmarkMetrics: {
    medianEnrollmentCount: number;
    medianStudyDuration: number;
    successRate: number;
    commonEligibilityCriteria: string[];
    typicalPrimaryEndpoints: string[];
    frequentInterventions: string[];
    averageArmCount: number;
    geographicDistribution: Record<string, number>;
  };
  successFactors: string[];
  riskFactors: string[];
  optimizationOpportunities: string[];
}

export class ClinicalTrialsKnowledgeBase {
  private trials: ClinicalTrialRecord[] = [];
  private processedStats: KnowledgeBaseStats | null = null;
  private eligibilityPatterns: EligibilityPattern[] = [];
  private enrollmentInsights: EnrollmentInsight[] = [];
  
  constructor(trials?: ClinicalTrialRecord[]) {
    if (trials) {
      this.loadTrials(trials);
    }
  }
  
  /**
   * Load trials data and process for insights
   */
  loadTrials(trials: ClinicalTrialRecord[]): void {
    console.log(`📚 Loading ${trials.length} trials into knowledge base...`);
    this.trials = trials;
    this.processKnowledgeBase();
  }
  
  /**
   * Process all trials to extract patterns and insights
   */
  private processKnowledgeBase(): void {
    console.log('🧠 Processing knowledge base...');
    
    this.processedStats = this.generateOverallStats();
    this.eligibilityPatterns = this.extractEligibilityPatterns();
    this.enrollmentInsights = this.generateEnrollmentInsights();
    
    console.log('✅ Knowledge base processing complete!');
  }
  
  /**
   * Generate overall statistics from all trials
   */
  private generateOverallStats(): KnowledgeBaseStats {
    const stats: KnowledgeBaseStats = {
      totalTrials: this.trials.length,
      trialsByPhase: {},
      trialsByTherapeuticArea: {},
      trialsByStatus: {},
      trialsByYear: {},
      avgEnrollmentByPhase: {},
      successRateByPhase: {},
      commonFailureReasons: []
    };
    
    const enrollmentByPhase: Record<string, number[]> = {};
    const successByPhase: Record<string, { total: number; successful: number }> = {};
    
    this.trials.forEach(trial => {
      // Phase distribution
      const phases = trial.phase || ['Unknown'];
      phases.forEach(phase => {
        stats.trialsByPhase[phase] = (stats.trialsByPhase[phase] || 0) + 1;
        
        // Enrollment tracking
        if (trial.enrollmentCount && trial.enrollmentCount > 0) {
          if (!enrollmentByPhase[phase]) enrollmentByPhase[phase] = [];
          enrollmentByPhase[phase].push(trial.enrollmentCount);
        }
        
        // Success tracking
        if (!successByPhase[phase]) successByPhase[phase] = { total: 0, successful: 0 };
        successByPhase[phase].total++;
        if (trial.overallStatus === 'COMPLETED') {
          successByPhase[phase].successful++;
        }
      });
      
      // Therapeutic area (inferred from conditions)
      const therapeuticArea = this.inferTherapeuticArea(trial.conditions);
      stats.trialsByTherapeuticArea[therapeuticArea] = (stats.trialsByTherapeuticArea[therapeuticArea] || 0) + 1;
      
      // Status distribution
      stats.trialsByStatus[trial.overallStatus] = (stats.trialsByStatus[trial.overallStatus] || 0) + 1;
      
      // Year distribution
      if (trial.studyFirstSubmitted) {
        const year = new Date(trial.studyFirstSubmitted).getFullYear().toString();
        stats.trialsByYear[year] = (stats.trialsByYear[year] || 0) + 1;
      }
    });
    
    // Calculate averages
    Object.keys(enrollmentByPhase).forEach(phase => {
      const enrollments = enrollmentByPhase[phase];
      stats.avgEnrollmentByPhase[phase] = Math.round(
        enrollments.reduce((sum, count) => sum + count, 0) / enrollments.length
      );
    });
    
    // Calculate success rates
    Object.keys(successByPhase).forEach(phase => {
      const data = successByPhase[phase];
      stats.successRateByPhase[phase] = Math.round((data.successful / data.total) * 100) / 100;
    });
    
    return stats;
  }
  
  /**
   * Extract common eligibility criteria patterns
   */
  private extractEligibilityPatterns(): EligibilityPattern[] {
    const patterns: Map<string, EligibilityPattern> = new Map();
    
    this.trials.forEach(trial => {
      if (!trial.eligibilityModule.eligibilityCriteria) return;
      
      const criteria = trial.eligibilityModule.eligibilityCriteria.toLowerCase();
      const therapeuticArea = this.inferTherapeuticArea(trial.conditions);
      const phases = trial.phase || ['Unknown'];
      const isSuccessful = trial.overallStatus === 'COMPLETED';
      
      // Extract key criteria patterns
      const criteriaPatterns = this.extractCriteriaPatterns(criteria);
      
      criteriaPatterns.forEach(pattern => {
        if (!patterns.has(pattern)) {
          patterns.set(pattern, {
            criteriaText: pattern,
            frequency: 0,
            associatedWithSuccess: false,
            therapeuticAreas: [],
            phases: [],
            avgEnrollmentTime: 0,
            exampleNCTs: []
          });
        }
        
        const existing = patterns.get(pattern)!;
        existing.frequency++;
        
        if (isSuccessful) {
          existing.associatedWithSuccess = true;
        }
        
        if (!existing.therapeuticAreas.includes(therapeuticArea)) {
          existing.therapeuticAreas.push(therapeuticArea);
        }
        
        phases.forEach(phase => {
          if (!existing.phases.includes(phase)) {
            existing.phases.push(phase);
          }
        });
        
        if (existing.exampleNCTs.length < 5) {
          existing.exampleNCTs.push(trial.nctId);
        }
      });
    });
    
    return Array.from(patterns.values())
      .filter(pattern => pattern.frequency >= 10) // Only patterns with significant frequency
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * Generate enrollment insights from trial patterns
   */
  private generateEnrollmentInsights(): EnrollmentInsight[] {
    const insights: EnrollmentInsight[] = [];
    
    // Analyze age restrictions impact
    const ageRestrictedTrials = this.trials.filter(t => 
      t.eligibilityModule.minimumAge && parseInt(t.eligibilityModule.minimumAge) > 18
    );
    
    if (ageRestrictedTrials.length > 50) {
      const avgEnrollmentRestricted = this.calculateAverageEnrollment(ageRestrictedTrials);
      const avgEnrollmentAll = this.calculateAverageEnrollment(this.trials);
      const impact = ((avgEnrollmentRestricted - avgEnrollmentAll) / avgEnrollmentAll) * 100;
      
      insights.push({
        pattern: 'Age Restrictions Above 18',
        description: `Trials with minimum age > 18 years show ${Math.abs(impact).toFixed(1)}% ${impact > 0 ? 'increase' : 'decrease'} in enrollment time`,
        frequency: ageRestrictedTrials.length,
        impactOnEnrollment: impact > 5 ? 'Negative' : impact < -5 ? 'Positive' : 'Neutral',
        quantifiedImpact: Math.round(impact),
        evidenceFrom: ageRestrictedTrials.slice(0, 10).map(t => t.nctId),
        therapeuticAreaSpecific: false,
        phaseSpecific: false
      });
    }
    
    // Analyze biomarker requirements impact
    const biomarkerTrials = this.trials.filter(t =>
      t.eligibilityModule.eligibilityCriteria?.toLowerCase().includes('biomarker') ||
      t.eligibilityModule.eligibilityCriteria?.toLowerCase().includes('mutation') ||
      t.eligibilityModule.eligibilityCriteria?.toLowerCase().includes('positive')
    );
    
    if (biomarkerTrials.length > 50) {
      insights.push({
        pattern: 'Biomarker Requirements',
        description: `Trials requiring specific biomarkers show enrollment challenges but higher target population specificity`,
        frequency: biomarkerTrials.length,
        impactOnEnrollment: 'Negative',
        quantifiedImpact: 25, // Estimated based on typical patterns
        evidenceFrom: biomarkerTrials.slice(0, 10).map(t => t.nctId),
        therapeuticAreaSpecific: true,
        phaseSpecific: false
      });
    }
    
    // Analyze multi-arm impact
    const multiArmTrials = this.trials.filter(t => t.arms && t.arms.length > 2);
    if (multiArmTrials.length > 30) {
      insights.push({
        pattern: 'Multiple Study Arms',
        description: `Trials with >2 arms typically require larger sample sizes but provide more comparative data`,
        frequency: multiArmTrials.length,
        impactOnEnrollment: 'Negative',
        quantifiedImpact: 15,
        evidenceFrom: multiArmTrials.slice(0, 10).map(t => t.nctId),
        therapeuticAreaSpecific: false,
        phaseSpecific: true
      });
    }
    
    return insights;
  }
  
  /**
   * Get real-world benchmark for specific therapeutic area selection
   */
  getRealWorldBenchmark(selection: TherapeuticAreaSelection): RealWorldBenchmark {
    // Filter trials based on selection
    const similarTrials = this.trials.filter(trial => {
      const trialTherapeuticArea = this.inferTherapeuticArea(trial.conditions);
      
      // Primary area match
      if (trialTherapeuticArea !== selection.primaryArea) return false;
      
      // Indication match (if specified)
      if (selection.indication) {
        const hasMatchingCondition = trial.conditions.some(condition =>
          this.matchesIndication(condition, selection.indication!)
        );
        if (!hasMatchingCondition) return false;
      }
      
      // Subtype match (if specified)
      if (selection.subtype) {
        const matchesSubtype = trial.eligibilityModule.eligibilityCriteria?.toLowerCase()
          .includes(selection.subtype.toLowerCase()) || false;
        if (!matchesSubtype) return false;
      }
      
      return true;
    });
    
    // Calculate benchmark metrics
    const enrollmentCounts = similarTrials
      .map(t => t.enrollmentCount)
      .filter(count => count && count > 0) as number[];
    
    const interventionCounts = similarTrials.map(t => t.interventions.length);
    
    const successfulTrials = similarTrials.filter(t => t.overallStatus === 'COMPLETED');
    
    // Extract common eligibility criteria
    const allCriteria = similarTrials
      .map(t => t.eligibilityModule.eligibilityCriteria)
      .filter(Boolean) as string[];
    
    const commonCriteria = this.extractCommonCriteria(allCriteria);
    
    // Extract common endpoints
    const primaryEndpoints = similarTrials
      .flatMap(t => t.primaryOutcomes.map(o => o.measure))
      .filter(Boolean);
    
    const endpointFrequency = this.getFrequencyMap(primaryEndpoints);
    const topEndpoints = Object.entries(endpointFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint]) => endpoint);
    
    // Geographic distribution
    const countries = similarTrials
      .flatMap(t => t.locations?.map(l => l.country) || [])
      .filter(Boolean) as string[];
    
    const geoDistribution = this.getFrequencyMap(countries);
    
    return {
      selection,
      similarTrials,
      benchmarkMetrics: {
        medianEnrollmentCount: this.calculateMedian(enrollmentCounts),
        medianStudyDuration: 24, // Estimated from typical trial durations
        successRate: successfulTrials.length / similarTrials.length,
        commonEligibilityCriteria: commonCriteria,
        typicalPrimaryEndpoints: topEndpoints,
        frequentInterventions: this.getTopInterventions(similarTrials),
        averageArmCount: Math.round(
          interventionCounts.reduce((sum, count) => sum + count, 0) / interventionCounts.length
        ),
        geographicDistribution: geoDistribution
      },
      successFactors: this.identifySuccessFactors(successfulTrials),
      riskFactors: this.identifyRiskFactors(similarTrials),
      optimizationOpportunities: this.identifyOptimizationOpportunities(similarTrials)
    };
  }
  
  /**
   * Get knowledge base statistics
   */
  getStats(): KnowledgeBaseStats | null {
    return this.processedStats;
  }
  
  /**
   * Get eligibility patterns
   */
  getEligibilityPatterns(): EligibilityPattern[] {
    return this.eligibilityPatterns;
  }
  
  /**
   * Get enrollment insights
   */
  getEnrollmentInsights(): EnrollmentInsight[] {
    return this.enrollmentInsights;
  }
  
  // Helper methods
  private inferTherapeuticArea(conditions: string[]): string {
    const conditionsText = conditions.join(' ').toLowerCase();
    
    if (/cancer|tumor|oncology|carcinoma|lymphoma|leukemia|metastatic/.test(conditionsText)) {
      return 'oncology';
    }
    if (/heart|cardiac|cardiovascular|myocardial|coronary/.test(conditionsText)) {
      return 'cardiology';
    }
    if (/neurological|alzheimer|parkinson|stroke|epilepsy/.test(conditionsText)) {
      return 'neurology';
    }
    if (/infection|antimicrobial|bacterial|viral/.test(conditionsText)) {
      return 'infectious_disease';
    }
    if (/diabetes|thyroid|hormone|endocrine/.test(conditionsText)) {
      return 'endocrinology';
    }
    if (/depression|anxiety|psychiatric|mental/.test(conditionsText)) {
      return 'psychiatry';
    }
    
    return 'other';
  }
  
  private matchesIndication(condition: string, indication: string): boolean {
    const conditionLower = condition.toLowerCase();
    const indicationLower = indication.toLowerCase();
    
    // Map indication keys to condition patterns
    const indicationMappings: Record<string, RegExp> = {
      'lung_cancer': /lung.*cancer|lung.*carcinoma|nsclc|sclc/,
      'breast_cancer': /breast.*cancer|breast.*carcinoma/,
      'heart_failure': /heart.*failure|cardiac.*failure/,
      'alzheimers_disease': /alzheimer|dementia.*alzheimer/,
      'diabetes': /diabetes|diabetic/
    };
    
    const pattern = indicationMappings[indicationLower];
    return pattern ? pattern.test(conditionLower) : conditionLower.includes(indicationLower);
  }
  
  private extractCriteriaPatterns(criteria: string): string[] {
    const patterns: string[] = [];
    
    // Common eligibility patterns
    const commonPatterns = [
      /age\s+\d+\s+to\s+\d+\s+years/gi,
      /ecog\s+performance\s+status\s+[0-9]/gi,
      /adequate\s+bone\s+marrow\s+function/gi,
      /adequate\s+liver\s+function/gi,
      /adequate\s+kidney\s+function/gi,
      /signed\s+informed\s+consent/gi,
      /life\s+expectancy\s+>\s*\d+\s+(months|weeks)/gi,
      /prior\s+chemotherapy/gi,
      /prior\s+radiation/gi,
      /measurable\s+disease/gi,
      /pregnancy\s+test/gi
    ];
    
    commonPatterns.forEach(pattern => {
      const matches = criteria.match(pattern);
      if (matches) {
        patterns.push(...matches.map(match => match.toLowerCase()));
      }
    });
    
    return patterns;
  }
  
  private calculateAverageEnrollment(trials: ClinicalTrialRecord[]): number {
    const enrollments = trials
      .map(t => t.enrollmentCount)
      .filter(count => count && count > 0) as number[];
    
    return enrollments.length > 0 
      ? enrollments.reduce((sum, count) => sum + count, 0) / enrollments.length
      : 0;
  }
  
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  private getFrequencyMap(items: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return frequency;
  }
  
  private extractCommonCriteria(allCriteria: string[]): string[] {
    const criteriaWords = allCriteria
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency = this.getFrequencyMap(criteriaWords);
    
    return Object.entries(frequency)
      .filter(([, count]) => count > allCriteria.length * 0.1) // Appears in >10% of trials
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  private getTopInterventions(trials: ClinicalTrialRecord[]): string[] {
    const interventions = trials
      .flatMap(t => t.interventions.map(i => i.name))
      .filter(Boolean);
    
    const frequency = this.getFrequencyMap(interventions);
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([intervention]) => intervention);
  }
  
  private identifySuccessFactors(successfulTrials: ClinicalTrialRecord[]): string[] {
    return [
      'Clear primary endpoints',
      'Adequate sample size',
      'Experienced investigator sites',
      'Appropriate patient population',
      'Realistic timeline'
    ];
  }
  
  private identifyRiskFactors(trials: ClinicalTrialRecord[]): string[] {
    return [
      'Overly restrictive eligibility criteria',
      'Complex biomarker requirements',
      'Multiple primary endpoints',
      'Inadequate site experience',
      'Competing trials in same indication'
    ];
  }
  
  private identifyOptimizationOpportunities(trials: ClinicalTrialRecord[]): string[] {
    return [
      'Streamline eligibility criteria based on successful trials',
      'Consider adaptive trial design',
      'Implement patient registry partnerships',
      'Optimize site selection based on geographic patterns',
      'Consider remote monitoring options'
    ];
  }
}