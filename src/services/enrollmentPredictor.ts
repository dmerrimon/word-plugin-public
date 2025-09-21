/**
 * Enrollment Feasibility Analyzer
 * Predicts enrollment challenges and timelines across all therapeutic areas
 */

export interface EnrollmentFeasibility {
  estimatedMonths: number;
  screenFailureRate: number; // percentage
  recommendedSites: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Difficult';
  riskFactors: EnrollmentRisk[];
  recommendations: string[];
  confidence: number; // 0-100
}

export interface EnrollmentRisk {
  factor: string;
  impact: 'Low' | 'Medium' | 'High';
  description: string;
  mitigation: string;
}

export interface EnrollmentFactors {
  targetSampleSize: number;
  inclusionCriteria: number;
  exclusionCriteria: number;
  ageRange: { min: number; max: number } | null;
  gender: 'male' | 'female' | 'both';
  diseasePrevalence: 'common' | 'uncommon' | 'rare' | 'very_rare';
  therapeuticArea: 'oncology' | 'cardiology' | 'neurology' | 'infectious_disease' | 'endocrinology' | 'psychiatry' | 'other';
  washoutPeriod: number; // days
  geographicRestrictions: boolean;
  biomarkerRequired: boolean;
  previousTreatmentRequired: boolean;
  comorbidityRestrictions: number;
  visitFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  studyDuration: number; // months
  invasiveProcedures: boolean;
  inpatientStays: boolean;
  competingTrials: 'low' | 'medium' | 'high';
}

export class EnrollmentPredictor {

  /**
   * Extract enrollment factors from protocol text
   */
  static extractEnrollmentFactors(text: string): EnrollmentFactors {
    return {
      targetSampleSize: this.extractSampleSize(text),
      inclusionCriteria: this.countInclusionCriteria(text),
      exclusionCriteria: this.countExclusionCriteria(text),
      ageRange: this.extractAgeRange(text),
      gender: this.extractGender(text),
      diseasePrevalence: this.estimateDiseasePrevalence(text),
      therapeuticArea: this.identifyTherapeuticArea(text),
      washoutPeriod: this.extractWashoutPeriod(text),
      geographicRestrictions: this.hasGeographicRestrictions(text),
      biomarkerRequired: this.requiresBiomarker(text),
      previousTreatmentRequired: this.requiresPreviousTreatment(text),
      comorbidityRestrictions: this.countComorbidityRestrictions(text),
      visitFrequency: this.determineVisitFrequency(text),
      studyDuration: this.extractStudyDuration(text),
      invasiveProcedures: this.hasInvasiveProcedures(text),
      inpatientStays: this.requiresInpatientStays(text),
      competingTrials: this.estimateCompetition(text)
    };
  }

  /**
   * Calculate enrollment feasibility score
   */
  static calculateEnrollmentFeasibility(factors: EnrollmentFactors): EnrollmentFeasibility {
    const baselineMonths = this.calculateBaselineEnrollment(factors);
    const difficultyMultiplier = this.calculateDifficultyMultiplier(factors);
    const estimatedMonths = Math.round(baselineMonths * difficultyMultiplier);
    
    const screenFailureRate = this.calculateScreenFailureRate(factors);
    const recommendedSites = this.calculateRecommendedSites(factors, estimatedMonths);
    const difficulty = this.categorizeDifficulty(difficultyMultiplier);
    const riskFactors = this.identifyRiskFactors(factors);
    const recommendations = this.generateRecommendations(factors, riskFactors);
    const confidence = this.calculateConfidence(factors);

    return {
      estimatedMonths,
      screenFailureRate,
      recommendedSites,
      difficulty,
      riskFactors,
      recommendations,
      confidence
    };
  }

  private static extractSampleSize(text: string): number {
    const patterns = [
      /sample\s+size[:\s]+(\d+)/i,
      /(\d+)\s+patients?\s+will\s+be\s+enrolled/i,
      /(\d+)\s+subjects?\s+will\s+be\s+enrolled/i,
      /total\s+of\s+(\d+)\s+patients?/i,
      /enrollment\s+of\s+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const size = parseInt(match[1]);
        if (size > 0 && size < 10000) { // Sanity check
          return size;
        }
      }
    }

    return 100; // Default assumption
  }

  private static countInclusionCriteria(text: string): number {
    const inclusionMatch = text.match(/inclusion\s+criteria[\s\S]*?(?=exclusion|endpoint)/i);
    if (!inclusionMatch) return 5; // Default

    const criteriaText = inclusionMatch[0];
    const counts = [
      (criteriaText.match(/\d+\./g) || []).length,
      (criteriaText.match(/•|\*|-\s/g) || []).length,
      (criteriaText.match(/\band\b/gi) || []).length / 2,
    ];

    return Math.max(1, Math.min(30, Math.max(...counts)));
  }

  private static countExclusionCriteria(text: string): number {
    const exclusionMatch = text.match(/exclusion\s+criteria[\s\S]*?(?=endpoint|objective)/i);
    if (!exclusionMatch) return 3; // Default

    const criteriaText = exclusionMatch[0];
    const counts = [
      (criteriaText.match(/\d+\./g) || []).length,
      (criteriaText.match(/•|\*|-\s/g) || []).length,
      (criteriaText.match(/\bor\b/gi) || []).length,
    ];

    return Math.max(0, Math.min(20, Math.max(...counts)));
  }

  private static extractAgeRange(text: string): { min: number; max: number } | null {
    const agePatterns = [
      /age[sd]?\s+(\d+)[-–](\d+)/i,
      /(\d+)\s+to\s+(\d+)\s+years?\s+of\s+age/i,
      /between\s+(\d+)\s+and\s+(\d+)\s+years?/i,
      /≥\s*(\d+)\s+years?.*?≤\s*(\d+)\s+years?/i
    ];

    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        if (min >= 0 && max <= 120 && min < max) {
          return { min, max };
        }
      }
    }

    return null; // No specific age range found
  }

  private static extractGender(text: string): 'male' | 'female' | 'both' {
    if (/male\s+only|men\s+only/i.test(text)) return 'male';
    if (/female\s+only|women\s+only/i.test(text)) return 'female';
    return 'both';
  }

  private static estimateDiseasePrevalence(text: string): EnrollmentFactors['diseasePrevalence'] {
    const rareDisease = /rare\s+disease|orphan\s+drug|prevalence.*?<.*?1.*?in.*?10000/i;
    const uncommonDisease = /uncommon|prevalence.*?<.*?1.*?in.*?1000/i;
    const commonDisease = /diabetes|hypertension|depression|obesity|asthma/i;

    if (rareDisease.test(text)) return 'very_rare';
    if (uncommonDisease.test(text)) return 'rare';
    if (commonDisease.test(text)) return 'common';
    
    return 'uncommon'; // Default
  }

  private static identifyTherapeuticArea(text: string): EnrollmentFactors['therapeuticArea'] {
    const areas = {
      oncology: /cancer|tumor|oncology|chemotherapy|radiation|metastatic/i,
      cardiology: /heart|cardiac|cardiovascular|myocardial|coronary/i,
      neurology: /neurological|alzheimer|parkinson|stroke|epilepsy|migraine/i,
      infectious_disease: /infection|antimicrobial|antibiotic|bacterial|viral/i,
      endocrinology: /diabetes|thyroid|hormone|endocrine|insulin/i,
      psychiatry: /depression|anxiety|psychiatric|mental\s+health|antidepressant/i
    };

    for (const [area, pattern] of Object.entries(areas)) {
      if (pattern.test(text)) {
        return area as EnrollmentFactors['therapeuticArea'];
      }
    }

    return 'other';
  }

  private static extractWashoutPeriod(text: string): number {
    const washoutPatterns = [
      /washout\s+period\s+of\s+(\d+)\s+days?/i,
      /(\d+)\s+day\s+washout/i,
      /(\d+)\s+week\s+washout/i,
      /wash\s+out.*?(\d+)\s+days?/i
    ];

    for (const pattern of washoutPatterns) {
      const match = text.match(pattern);
      if (match) {
        let days = parseInt(match[1]);
        if (pattern.source.includes('week')) {
          days *= 7; // Convert weeks to days
        }
        return Math.min(365, days); // Cap at 1 year
      }
    }

    return 0; // No washout required
  }

  private static hasGeographicRestrictions(text: string): boolean {
    return /specific\s+geographic|limited\s+to.*?region|only\s+in.*?country/i.test(text);
  }

  private static requiresBiomarker(text: string): boolean {
    return /biomarker|genetic\s+test|mutation|expression\s+level/i.test(text);
  }

  private static requiresPreviousTreatment(text: string): boolean {
    return /previous\s+treatment|prior\s+therapy|treatment.*?failed|refractory/i.test(text);
  }

  private static countComorbidityRestrictions(text: string): number {
    const comorbidityPatterns = [
      /significant\s+comorbidity/i,
      /hepatic\s+impairment/i,
      /renal\s+impairment/i,
      /cardiac\s+disease/i,
      /psychiatric\s+disorder/i
    ];

    let count = 0;
    comorbidityPatterns.forEach(pattern => {
      if (pattern.test(text)) count++;
    });

    return count;
  }

  private static determineVisitFrequency(text: string): EnrollmentFactors['visitFrequency'] {
    if (/daily\s+visit|every\s+day/i.test(text)) return 'daily';
    if (/weekly\s+visit|every\s+week/i.test(text)) return 'weekly';
    if (/biweekly|every\s+2\s+weeks/i.test(text)) return 'biweekly';
    return 'monthly';
  }

  private static extractStudyDuration(text: string): number {
    const durationPatterns = [
      /study\s+duration[:\s]+(\d+)\s+months?/i,
      /(\d+)\s+month\s+study/i,
      /treatment\s+period[:\s]+(\d+)\s+months?/i,
      /follow[-\s]up.*?(\d+)\s+months?/i
    ];

    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const months = parseInt(match[1]);
        if (months > 0 && months <= 60) { // Sanity check
          return months;
        }
      }
    }

    return 12; // Default 1 year
  }

  private static hasInvasiveProcedures(text: string): boolean {
    return /biopsy|surgery|invasive|catheter|injection/i.test(text);
  }

  private static requiresInpatientStays(text: string): boolean {
    return /inpatient|hospital\s+stay|overnight\s+stay|admission/i.test(text);
  }

  private static estimateCompetition(text: string): EnrollmentFactors['competingTrials'] {
    // This would ideally check against clinicaltrials.gov API
    // For now, estimate based on therapeutic area
    const highCompetition = /oncology|cancer|alzheimer/i;
    const mediumCompetition = /diabetes|hypertension|depression/i;

    if (highCompetition.test(text)) return 'high';
    if (mediumCompetition.test(text)) return 'medium';
    return 'low';
  }

  private static calculateBaselineEnrollment(factors: EnrollmentFactors): number {
    // Base months to enroll 100 patients by therapeutic area
    const baselineByArea = {
      oncology: 8,
      cardiology: 12,
      neurology: 15,
      infectious_disease: 6,
      endocrinology: 10,
      psychiatry: 14,
      other: 12
    };

    const baseMonths = baselineByArea[factors.therapeuticArea];
    
    // Scale by sample size
    return (factors.targetSampleSize / 100) * baseMonths;
  }

  private static calculateDifficultyMultiplier(factors: EnrollmentFactors): number {
    let multiplier = 1.0;

    // Eligibility criteria impact
    const totalCriteria = factors.inclusionCriteria + factors.exclusionCriteria;
    if (totalCriteria > 15) multiplier *= 1.5;
    else if (totalCriteria > 10) multiplier *= 1.2;

    // Age restrictions
    if (factors.ageRange) {
      const ageSpan = factors.ageRange.max - factors.ageRange.min;
      if (ageSpan < 20) multiplier *= 1.3;
      if (factors.ageRange.min > 65) multiplier *= 1.4;
      if (factors.ageRange.max < 18) multiplier *= 1.2;
    }

    // Gender restrictions
    if (factors.gender !== 'both') multiplier *= 1.5;

    // Disease prevalence
    const prevalenceMultipliers = {
      very_rare: 3.0,
      rare: 2.0,
      uncommon: 1.3,
      common: 1.0
    };
    multiplier *= prevalenceMultipliers[factors.diseasePrevalence];

    // Washout period
    if (factors.washoutPeriod > 30) multiplier *= 1.2;
    if (factors.washoutPeriod > 90) multiplier *= 1.4;

    // Other factors
    if (factors.geographicRestrictions) multiplier *= 1.3;
    if (factors.biomarkerRequired) multiplier *= 1.6;
    if (factors.previousTreatmentRequired) multiplier *= 1.4;
    if (factors.comorbidityRestrictions > 2) multiplier *= 1.3;
    if (factors.invasiveProcedures) multiplier *= 1.2;
    if (factors.inpatientStays) multiplier *= 1.4;

    // Visit frequency
    const frequencyMultipliers = {
      daily: 2.0,
      weekly: 1.4,
      biweekly: 1.2,
      monthly: 1.0
    };
    multiplier *= frequencyMultipliers[factors.visitFrequency];

    // Competition
    const competitionMultipliers = {
      high: 1.5,
      medium: 1.2,
      low: 1.0
    };
    multiplier *= competitionMultipliers[factors.competingTrials];

    return multiplier;
  }

  private static calculateScreenFailureRate(factors: EnrollmentFactors): number {
    let baseRate = 30; // Default 30% screen failure

    // Adjust based on criteria complexity
    const totalCriteria = factors.inclusionCriteria + factors.exclusionCriteria;
    if (totalCriteria > 15) baseRate += 25;
    else if (totalCriteria > 10) baseRate += 15;

    // Biomarker requirements increase screen failure
    if (factors.biomarkerRequired) baseRate += 20;

    // Previous treatment requirements
    if (factors.previousTreatmentRequired) baseRate += 15;

    // Comorbidity restrictions
    baseRate += factors.comorbidityRestrictions * 5;

    // Cap at reasonable maximum
    return Math.min(85, baseRate);
  }

  private static calculateRecommendedSites(factors: EnrollmentFactors, estimatedMonths: number): number {
    // Base calculation: 1 site per 5-10 patients per month
    const patientsPerSitePerMonth = factors.diseasePrevalence === 'common' ? 3 : 
                                   factors.diseasePrevalence === 'uncommon' ? 2 : 1;
    
    const sitesNeeded = Math.ceil(factors.targetSampleSize / (patientsPerSitePerMonth * estimatedMonths));
    
    // Minimum and maximum bounds
    return Math.max(1, Math.min(100, sitesNeeded));
  }

  private static categorizeDifficulty(multiplier: number): EnrollmentFeasibility['difficulty'] {
    if (multiplier <= 1.2) return 'Easy';
    if (multiplier <= 1.8) return 'Moderate';
    if (multiplier <= 2.5) return 'Challenging';
    return 'Difficult';
  }

  private static identifyRiskFactors(factors: EnrollmentFactors): EnrollmentRisk[] {
    const risks: EnrollmentRisk[] = [];

    const totalCriteria = factors.inclusionCriteria + factors.exclusionCriteria;
    if (totalCriteria > 15) {
      risks.push({
        factor: 'Complex Eligibility',
        impact: 'High',
        description: `${totalCriteria} eligibility criteria may exclude many potential patients`,
        mitigation: 'Review each criterion for necessity; consider broadening inclusion criteria'
      });
    }

    if (factors.biomarkerRequired) {
      risks.push({
        factor: 'Biomarker Requirement',
        impact: 'High',
        description: 'Biomarker testing will increase screen failure rate significantly',
        mitigation: 'Partner with labs for rapid testing; consider broader biomarker definition'
      });
    }

    if (factors.diseasePrevalence === 'rare' || factors.diseasePrevalence === 'very_rare') {
      risks.push({
        factor: 'Rare Disease',
        impact: 'High',
        description: 'Limited patient population will slow enrollment',
        mitigation: 'Expand to international sites; partner with patient advocacy groups'
      });
    }

    if (factors.washoutPeriod > 90) {
      risks.push({
        factor: 'Long Washout Period',
        impact: 'Medium',
        description: `${factors.washoutPeriod} day washout may deter patients`,
        mitigation: 'Consider if full washout is necessary; allow stable background therapy'
      });
    }

    if (factors.visitFrequency === 'weekly' || factors.visitFrequency === 'daily') {
      risks.push({
        factor: 'Frequent Visits',
        impact: 'Medium',
        description: `${factors.visitFrequency} visits create high patient burden`,
        mitigation: 'Consider home nursing visits; reduce non-essential assessments'
      });
    }

    return risks;
  }

  private static generateRecommendations(factors: EnrollmentFactors, risks: EnrollmentRisk[]): string[] {
    const recommendations: string[] = [];

    if (risks.length > 2) {
      recommendations.push('Consider protocol amendments to reduce enrollment barriers');
    }

    if (factors.targetSampleSize > 500) {
      recommendations.push('Large sample size - consider adaptive enrollment strategies');
    }

    if (factors.diseasePrevalence === 'rare') {
      recommendations.push('Partner with patient registries and advocacy groups for recruitment');
    }

    if (factors.geographicRestrictions) {
      recommendations.push('Expand geographic scope if possible to increase patient pool');
    }

    if (recommendations.length === 0) {
      recommendations.push('Enrollment plan appears feasible with current design');
    }

    return recommendations;
  }

  private static calculateConfidence(factors: EnrollmentFactors): number {
    // Higher confidence for well-defined protocols
    let confidence = 70; // Base confidence

    if (factors.therapeuticArea !== 'other') confidence += 10;
    if (factors.diseasePrevalence === 'common') confidence += 15;
    if (factors.targetSampleSize < 200) confidence += 10;
    if (!factors.biomarkerRequired) confidence += 5;

    return Math.min(95, confidence);
  }
}