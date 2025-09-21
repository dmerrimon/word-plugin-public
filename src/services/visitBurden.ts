/**
 * Visit Burden Calculator
 * Analyzes patient and site burden across all therapeutic areas
 */

export interface VisitBurdenAnalysis {
  patientBurdenScore: number; // 0-100
  siteBurdenScore: number; // 0-100
  overallBurden: 'Low' | 'Moderate' | 'High' | 'Very High';
  totalVisits: number;
  estimatedTimePerVisit: number; // minutes
  totalStudyTime: number; // hours
  recommendations: BurdenRecommendation[];
  visitDetails: VisitDetail[];
  complianceRisk: number; // 0-100, higher = more risk of dropout
}

export interface BurdenRecommendation {
  type: 'reduce_frequency' | 'combine_visits' | 'split_procedures' | 'remote_monitoring' | 'optimize_schedule';
  description: string;
  expectedReduction: number; // percentage reduction in burden
  priority: 'High' | 'Medium' | 'Low';
}

export interface VisitDetail {
  visitName: string;
  timepoint: string;
  procedures: string[];
  estimatedTime: number; // minutes
  complexity: 'Simple' | 'Moderate' | 'Complex';
  burdensomeFactors: string[];
}

export interface VisitFactors {
  totalVisits: number;
  visitFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  studyDuration: number; // months
  screeningVisits: number;
  treatmentVisits: number;
  followUpVisits: number;
  procedures: ProcedureCount;
  specialRequirements: SpecialRequirement[];
  geographicFactors: GeographicFactor[];
}

export interface ProcedureCount {
  bloodDraws: number;
  imagingScans: number;
  physicalExams: number;
  questionnaires: number;
  specializedTests: number;
  biopsies: number;
  pharmacokineticSamples: number;
  vitalSigns: number;
  ecgs: number;
  deviceProcedures: number;
}

export interface SpecialRequirement {
  type: 'fasting' | 'overnight_stay' | 'sedation' | 'isolation' | 'dietary_restriction' | 'medication_timing';
  frequency: number;
  description: string;
  additionalTime: number; // minutes
}

export interface GeographicFactor {
  type: 'urban' | 'rural' | 'limited_sites';
  impact: number; // multiplier for travel burden
  description: string;
}

export class VisitBurdenCalculator {

  /**
   * Extract visit burden factors from protocol text
   */
  static extractVisitFactors(text: string): VisitFactors {
    return {
      totalVisits: this.countTotalVisits(text),
      visitFrequency: this.determineVisitFrequency(text),
      studyDuration: this.extractStudyDuration(text),
      screeningVisits: this.countScreeningVisits(text),
      treatmentVisits: this.countTreatmentVisits(text),
      followUpVisits: this.countFollowUpVisits(text),
      procedures: this.countProcedures(text),
      specialRequirements: this.identifySpecialRequirements(text),
      geographicFactors: this.assessGeographicFactors(text)
    };
  }

  /**
   * Calculate comprehensive visit burden analysis
   */
  static calculateVisitBurden(factors: VisitFactors): VisitBurdenAnalysis {
    const patientBurdenScore = this.calculatePatientBurden(factors);
    const siteBurdenScore = this.calculateSiteBurden(factors);
    const overallBurden = this.categorizeOverallBurden(patientBurdenScore, siteBurdenScore);
    const estimatedTimePerVisit = this.calculateTimePerVisit(factors);
    const totalStudyTime = this.calculateTotalStudyTime(factors, estimatedTimePerVisit);
    const complianceRisk = this.calculateComplianceRisk(factors, patientBurdenScore);
    const visitDetails = this.generateVisitDetails(factors);
    const recommendations = this.generateRecommendations(factors, patientBurdenScore, siteBurdenScore);

    return {
      patientBurdenScore,
      siteBurdenScore,
      overallBurden,
      totalVisits: factors.totalVisits,
      estimatedTimePerVisit,
      totalStudyTime,
      recommendations,
      visitDetails,
      complianceRisk
    };
  }

  private static countTotalVisits(text: string): number {
    const visitPatterns = [
      /visit\s+\d+/gi,
      /week\s+\d+/gi,
      /day\s+\d+/gi,
      /screening|baseline|follow[-\s]?up|end\s+of\s+study/gi
    ];

    const allVisits = new Set<string>();
    visitPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => allVisits.add(match.toLowerCase().trim()));
    });

    return Math.min(50, Math.max(1, allVisits.size));
  }

  private static determineVisitFrequency(text: string): VisitFactors['visitFrequency'] {
    if (/daily\s+visit|every\s+day/i.test(text)) return 'daily';
    if (/weekly\s+visit|every\s+week/i.test(text)) return 'weekly';
    if (/biweekly|every\s+2\s+weeks/i.test(text)) return 'biweekly';
    if (/quarterly|every\s+3\s+months/i.test(text)) return 'quarterly';
    return 'monthly';
  }

  private static extractStudyDuration(text: string): number {
    const durationPatterns = [
      /study\s+duration[:\s]+(\d+)\s+months?/i,
      /(\d+)\s+month\s+study/i,
      /treatment.*?(\d+)\s+months?/i,
      /follow[-\s]up.*?(\d+)\s+months?/i
    ];

    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const months = parseInt(match[1]);
        if (months > 0 && months <= 60) {
          return months;
        }
      }
    }

    return 12; // Default
  }

  private static countScreeningVisits(text: string): number {
    const screeningSection = text.match(/screening[\s\S]*?(?=baseline|treatment|randomization)/i);
    if (!screeningSection) return 1;

    const visitCount = (screeningSection[0].match(/visit|day/gi) || []).length;
    return Math.max(1, Math.min(5, visitCount));
  }

  private static countTreatmentVisits(text: string): number {
    const treatmentSection = text.match(/treatment[\s\S]*?(?=follow|safety|endpoint)/i);
    if (!treatmentSection) return 5;

    const visitCount = (treatmentSection[0].match(/visit|week|cycle/gi) || []).length;
    return Math.max(1, Math.min(30, visitCount));
  }

  private static countFollowUpVisits(text: string): number {
    const followUpSection = text.match(/follow[-\s]?up[\s\S]*?(?=endpoint|analysis|conclusion)/i);
    if (!followUpSection) return 2;

    const visitCount = (followUpSection[0].match(/visit|month|contact/gi) || []).length;
    return Math.max(0, Math.min(10, visitCount));
  }

  private static countProcedures(text: string): ProcedureCount {
    const procedurePatterns = {
      bloodDraws: /blood\s+draw|phlebotomy|blood\s+sample|venipuncture/gi,
      imagingScans: /ct\s+scan|mri|x[-\s]?ray|ultrasound|pet\s+scan|imaging/gi,
      physicalExams: /physical\s+exam|clinical\s+exam|examination/gi,
      questionnaires: /questionnaire|survey|assessment\s+scale|diary/gi,
      specializedTests: /pulmonary\s+function|stress\s+test|biopsy|endoscopy/gi,
      biopsies: /biopsy|tissue\s+sample/gi,
      pharmacokineticSamples: /pharmacokinetic|pk\s+sample|drug\s+level/gi,
      vitalSigns: /vital\s+signs|blood\s+pressure|heart\s+rate|temperature/gi,
      ecgs: /ecg|ekg|electrocardiogram/gi,
      deviceProcedures: /device\s+implant|catheter|monitor\s+placement/gi
    };

    const counts: ProcedureCount = {
      bloodDraws: 0,
      imagingScans: 0,
      physicalExams: 0,
      questionnaires: 0,
      specializedTests: 0,
      biopsies: 0,
      pharmacokineticSamples: 0,
      vitalSigns: 0,
      ecgs: 0,
      deviceProcedures: 0
    };

    Object.entries(procedurePatterns).forEach(([key, pattern]) => {
      const matches = text.match(pattern) || [];
      counts[key as keyof ProcedureCount] = Math.min(20, matches.length);
    });

    return counts;
  }

  private static identifySpecialRequirements(text: string): SpecialRequirement[] {
    const requirements: SpecialRequirement[] = [];

    if (/fasting|nil\s+by\s+mouth|npo/i.test(text)) {
      requirements.push({
        type: 'fasting',
        frequency: 1,
        description: 'Fasting required before procedures',
        additionalTime: 60
      });
    }

    if (/overnight\s+stay|inpatient|hospital\s+admission/i.test(text)) {
      requirements.push({
        type: 'overnight_stay',
        frequency: (text.match(/overnight|inpatient/gi) || []).length,
        description: 'Overnight hospital stay required',
        additionalTime: 720 // 12 hours
      });
    }

    if (/sedation|anesthesia|conscious\s+sedation/i.test(text)) {
      requirements.push({
        type: 'sedation',
        frequency: (text.match(/sedation|anesthesia/gi) || []).length,
        description: 'Sedation required for procedures',
        additionalTime: 120
      });
    }

    if (/isolation|quarantine|infectious/i.test(text)) {
      requirements.push({
        type: 'isolation',
        frequency: 1,
        description: 'Isolation precautions required',
        additionalTime: 30
      });
    }

    return requirements;
  }

  private static assessGeographicFactors(text: string): GeographicFactor[] {
    const factors: GeographicFactor[] = [];

    if (/rural|remote\s+area/i.test(text)) {
      factors.push({
        type: 'rural',
        impact: 1.5,
        description: 'Rural patient population increases travel burden'
      });
    }

    if (/limited\s+sites|few\s+centers|specialized\s+center/i.test(text)) {
      factors.push({
        type: 'limited_sites',
        impact: 1.3,
        description: 'Limited number of participating sites'
      });
    }

    if (factors.length === 0) {
      factors.push({
        type: 'urban',
        impact: 1.0,
        description: 'Standard urban accessibility'
      });
    }

    return factors;
  }

  private static calculatePatientBurden(factors: VisitFactors): number {
    let score = 0;

    // Base score from visit frequency
    const frequencyScores = {
      daily: 90,
      weekly: 70,
      biweekly: 50,
      monthly: 30,
      quarterly: 15
    };
    score += frequencyScores[factors.visitFrequency];

    // Total visits impact
    if (factors.totalVisits > 20) score += 30;
    else if (factors.totalVisits > 15) score += 20;
    else if (factors.totalVisits > 10) score += 10;

    // Study duration impact
    if (factors.studyDuration > 24) score += 15;
    else if (factors.studyDuration > 12) score += 10;

    // Procedure burden
    const totalProcedures = Object.values(factors.procedures).reduce((sum, count) => sum + count, 0);
    if (totalProcedures > 30) score += 25;
    else if (totalProcedures > 20) score += 15;
    else if (totalProcedures > 10) score += 10;

    // Special requirements
    factors.specialRequirements.forEach(req => {
      const requirementScores = {
        fasting: 10,
        overnight_stay: 25,
        sedation: 15,
        isolation: 20,
        dietary_restriction: 8,
        medication_timing: 5
      };
      score += requirementScores[req.type] * req.frequency;
    });

    // Geographic factors
    factors.geographicFactors.forEach(factor => {
      if (factor.type === 'rural') score += 15;
      if (factor.type === 'limited_sites') score += 10;
    });

    return Math.min(100, score);
  }

  private static calculateSiteBurden(factors: VisitFactors): number {
    let score = 0;

    // Visit frequency impact on site resources
    const frequencyScores = {
      daily: 80,
      weekly: 60,
      biweekly: 40,
      monthly: 25,
      quarterly: 15
    };
    score += frequencyScores[factors.visitFrequency];

    // Complex procedures
    const complexProcedures = factors.procedures.biopsies + 
                             factors.procedures.specializedTests + 
                             factors.procedures.deviceProcedures;
    score += complexProcedures * 5;

    // Imaging requirements
    score += factors.procedures.imagingScans * 3;

    // PK sampling complexity
    score += factors.procedures.pharmacokineticSamples * 4;

    // Special requirements burden on site
    factors.specialRequirements.forEach(req => {
      const siteRequirementScores = {
        fasting: 5,
        overnight_stay: 20,
        sedation: 15,
        isolation: 25,
        dietary_restriction: 5,
        medication_timing: 8
      };
      score += siteRequirementScores[req.type] * req.frequency;
    });

    return Math.min(100, score);
  }

  private static categorizeOverallBurden(patientScore: number, siteScore: number): VisitBurdenAnalysis['overallBurden'] {
    const averageScore = (patientScore + siteScore) / 2;

    if (averageScore <= 30) return 'Low';
    if (averageScore <= 55) return 'Moderate';
    if (averageScore <= 75) return 'High';
    return 'Very High';
  }

  private static calculateTimePerVisit(factors: VisitFactors): number {
    let baseTime = 60; // minutes

    // Add time for procedures
    const procedureTimes = {
      bloodDraws: 10,
      imagingScans: 45,
      physicalExams: 30,
      questionnaires: 15,
      specializedTests: 60,
      biopsies: 90,
      pharmacokineticSamples: 15,
      vitalSigns: 10,
      ecgs: 15,
      deviceProcedures: 120
    };

    Object.entries(factors.procedures).forEach(([procedure, count]) => {
      const timePerProcedure = procedureTimes[procedure as keyof typeof procedureTimes];
      baseTime += (timePerProcedure * count) / factors.totalVisits; // Average across visits
    });

    // Add time for special requirements
    factors.specialRequirements.forEach(req => {
      baseTime += req.additionalTime / factors.totalVisits;
    });

    return Math.round(baseTime);
  }

  private static calculateTotalStudyTime(factors: VisitFactors, timePerVisit: number): number {
    return Math.round((factors.totalVisits * timePerVisit) / 60); // Convert to hours
  }

  private static calculateComplianceRisk(factors: VisitFactors, patientBurdenScore: number): number {
    let risk = patientBurdenScore * 0.6; // Base risk from burden

    // Frequency impact on compliance
    const frequencyRisk = {
      daily: 30,
      weekly: 20,
      biweekly: 10,
      monthly: 5,
      quarterly: 0
    };
    risk += frequencyRisk[factors.visitFrequency];

    // Study duration impact
    if (factors.studyDuration > 24) risk += 15;
    else if (factors.studyDuration > 12) risk += 10;

    // Special requirements increase dropout risk
    factors.specialRequirements.forEach(req => {
      if (req.type === 'overnight_stay') risk += 15;
      if (req.type === 'sedation') risk += 10;
      if (req.type === 'fasting') risk += 5;
    });

    return Math.min(95, Math.round(risk));
  }

  private static generateVisitDetails(factors: VisitFactors): VisitDetail[] {
    const visits: VisitDetail[] = [];

    // Generate screening visit
    visits.push({
      visitName: 'Screening',
      timepoint: 'Day -28 to -1',
      procedures: ['Physical exam', 'Blood draw', 'Vital signs', 'ECG', 'Medical history'],
      estimatedTime: 120,
      complexity: 'Moderate',
      burdensomeFactors: factors.procedures.biopsies > 0 ? ['Tissue biopsy required'] : []
    });

    // Generate baseline visit
    visits.push({
      visitName: 'Baseline/Randomization',
      timepoint: 'Day 1',
      procedures: ['Physical exam', 'Blood draw', 'Questionnaires', 'Randomization'],
      estimatedTime: 90,
      complexity: 'Moderate',
      burdensomeFactors: []
    });

    // Generate treatment visits
    for (let i = 1; i <= Math.min(5, factors.treatmentVisits); i++) {
      const procedures = ['Vital signs', 'Safety assessment'];
      if (factors.procedures.bloodDraws > 0) procedures.push('Blood draw');
      if (factors.procedures.questionnaires > 0) procedures.push('Questionnaires');

      visits.push({
        visitName: `Treatment Visit ${i}`,
        timepoint: `Week ${i * 2}`,
        procedures,
        estimatedTime: 60,
        complexity: 'Simple',
        burdensomeFactors: factors.visitFrequency === 'weekly' ? ['Weekly frequency'] : []
      });
    }

    // Generate follow-up visit
    if (factors.followUpVisits > 0) {
      visits.push({
        visitName: 'End of Study',
        timepoint: `Month ${factors.studyDuration}`,
        procedures: ['Physical exam', 'Blood draw', 'Safety follow-up', 'Final assessments'],
        estimatedTime: 90,
        complexity: 'Moderate',
        burdensomeFactors: []
      });
    }

    return visits;
  }

  private static generateRecommendations(factors: VisitFactors, patientScore: number, siteScore: number): BurdenRecommendation[] {
    const recommendations: BurdenRecommendation[] = [];

    if (factors.visitFrequency === 'weekly' && factors.totalVisits > 12) {
      recommendations.push({
        type: 'reduce_frequency',
        description: 'Consider reducing weekly visits to biweekly after initial treatment period',
        expectedReduction: 20,
        priority: 'High'
      });
    }

    if (factors.totalVisits > 15) {
      recommendations.push({
        type: 'combine_visits',
        description: 'Evaluate if some visits can be combined to reduce total number',
        expectedReduction: 15,
        priority: 'Medium'
      });
    }

    const totalProcedures = Object.values(factors.procedures).reduce((sum, count) => sum + count, 0);
    if (totalProcedures > 25) {
      recommendations.push({
        type: 'split_procedures',
        description: 'Consider splitting high-procedure visits to reduce per-visit burden',
        expectedReduction: 12,
        priority: 'Medium'
      });
    }

    if (factors.procedures.vitalSigns > 5 || factors.procedures.questionnaires > 8) {
      recommendations.push({
        type: 'remote_monitoring',
        description: 'Implement remote monitoring for routine assessments between visits',
        expectedReduction: 25,
        priority: 'High'
      });
    }

    if (patientScore > 70) {
      recommendations.push({
        type: 'optimize_schedule',
        description: 'Optimize visit scheduling to reduce patient travel and waiting time',
        expectedReduction: 10,
        priority: 'Medium'
      });
    }

    return recommendations;
  }
}