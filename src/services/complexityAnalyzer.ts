/**
 * Protocol Complexity Analyzer
 * Universal scoring system for clinical trial complexity across all therapeutic areas
 */

export interface ComplexityScore {
  overall: number; // 0-100
  breakdown: {
    eligibility: number;
    visits: number; 
    endpoints: number;
    procedures: number;
    length: number;
    logic: number;
  };
  category: 'Simple' | 'Moderate' | 'Complex' | 'Highly Complex';
  recommendations: string[];
  percentile: number; // Compared to similar protocols
}

export interface ComplexityFactors {
  inclusionCriteria: number;
  exclusionCriteria: number;
  totalVisits: number;
  visitFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  proceduresPerVisit: number;
  primaryEndpoints: number;
  secondaryEndpoints: number;
  exploratoryEndpoints: number;
  labRequirements: number;
  imagingRequirements: number;
  protocolWordCount: number;
  conditionalStatements: number;
  studyArms: number;
  cohorts: number;
  adaptiveElements: boolean;
  interimAnalyses: number;
}

export class ComplexityAnalyzer {
  
  /**
   * Analyze protocol text and extract complexity factors
   */
  static analyzeProtocolText(text: string): ComplexityFactors {
    const factors: ComplexityFactors = {
      inclusionCriteria: this.countInclusionCriteria(text),
      exclusionCriteria: this.countExclusionCriteria(text),
      totalVisits: this.countVisits(text),
      visitFrequency: this.determineVisitFrequency(text),
      proceduresPerVisit: this.countProceduresPerVisit(text),
      primaryEndpoints: this.countPrimaryEndpoints(text),
      secondaryEndpoints: this.countSecondaryEndpoints(text),
      exploratoryEndpoints: this.countExploratoryEndpoints(text),
      labRequirements: this.countLabRequirements(text),
      imagingRequirements: this.countImagingRequirements(text),
      protocolWordCount: text.split(/\s+/).length,
      conditionalStatements: this.countConditionalLogic(text),
      studyArms: this.countStudyArms(text),
      cohorts: this.countCohorts(text),
      adaptiveElements: this.hasAdaptiveElements(text),
      interimAnalyses: this.countInterimAnalyses(text)
    };

    return factors;
  }

  /**
   * Calculate overall complexity score from factors
   */
  static calculateComplexityScore(factors: ComplexityFactors): ComplexityScore {
    const weights = {
      eligibility: 0.20,
      visits: 0.18,
      endpoints: 0.15,
      procedures: 0.15,
      length: 0.12,
      logic: 0.20
    };

    // Calculate sub-scores (0-100)
    const eligibilityScore = this.calculateEligibilityScore(factors);
    const visitsScore = this.calculateVisitsScore(factors);
    const endpointsScore = this.calculateEndpointsScore(factors);
    const proceduresScore = this.calculateProceduresScore(factors);
    const lengthScore = this.calculateLengthScore(factors);
    const logicScore = this.calculateLogicScore(factors);

    const breakdown = {
      eligibility: eligibilityScore,
      visits: visitsScore,
      endpoints: endpointsScore,
      procedures: proceduresScore,
      length: lengthScore,
      logic: logicScore
    };

    // Weighted overall score
    const overall = Math.round(
      eligibilityScore * weights.eligibility +
      visitsScore * weights.visits +
      endpointsScore * weights.endpoints +
      proceduresScore * weights.procedures +
      lengthScore * weights.length +
      logicScore * weights.logic
    );

    const category = this.categorizeComplexity(overall);
    const recommendations = this.generateRecommendations(factors, breakdown);
    const percentile = this.calculatePercentile(overall, factors);

    return {
      overall,
      breakdown,
      category,
      recommendations,
      percentile
    };
  }

  private static countInclusionCriteria(text: string): number {
    const patterns = [
      /inclusion\s+criteria[\s\S]*?(?=exclusion|endpoint|objective)/i,
      /patients?\s+must[\s\S]*?(?=exclusion|endpoint)/i,
      /subjects?\s+must[\s\S]*?(?=exclusion|endpoint)/i
    ];

    let maxCount = 0;
    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        // Count numbered items, bullet points, or 'and' statements
        const criteriaText = match[0];
        const counts = [
          (criteriaText.match(/\d+\./g) || []).length,
          (criteriaText.match(/•|\*|-\s/g) || []).length,
          (criteriaText.match(/\band\b/gi) || []).length / 2, // Estimate
        ];
        maxCount = Math.max(maxCount, Math.max(...counts));
      }
    });

    return Math.max(1, Math.min(50, maxCount)); // Cap at reasonable range
  }

  private static countExclusionCriteria(text: string): number {
    const patterns = [
      /exclusion\s+criteria[\s\S]*?(?=endpoint|objective|study\s+design)/i,
      /patients?\s+will\s+be\s+excluded[\s\S]*?(?=endpoint|objective)/i
    ];

    let maxCount = 0;
    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        const criteriaText = match[0];
        const counts = [
          (criteriaText.match(/\d+\./g) || []).length,
          (criteriaText.match(/•|\*|-\s/g) || []).length,
          (criteriaText.match(/\bor\b/gi) || []).length,
        ];
        maxCount = Math.max(maxCount, Math.max(...counts));
      }
    });

    return Math.max(0, Math.min(30, maxCount));
  }

  private static countVisits(text: string): number {
    const visitPatterns = [
      /visit\s+\d+/gi,
      /week\s+\d+/gi,
      /day\s+\d+/gi,
      /month\s+\d+/gi,
      /screening|baseline|follow-?up|end\s+of\s+study/gi
    ];

    const allMatches = new Set<string>();
    visitPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => allMatches.add(match.toLowerCase()));
    });

    return Math.min(50, allMatches.size); // Cap at 50 visits
  }

  private static determineVisitFrequency(text: string): ComplexityFactors['visitFrequency'] {
    const frequencyPatterns = {
      daily: /daily|every\s+day/i,
      weekly: /weekly|every\s+week/i,
      biweekly: /biweekly|every\s+two\s+weeks|every\s+2\s+weeks/i,
      monthly: /monthly|every\s+month/i,
      quarterly: /quarterly|every\s+3\s+months/i
    };

    for (const [frequency, pattern] of Object.entries(frequencyPatterns)) {
      if (pattern.test(text)) {
        return frequency as ComplexityFactors['visitFrequency'];
      }
    }

    return 'monthly'; // Default
  }

  private static countProceduresPerVisit(text: string): number {
    const procedurePatterns = [
      /blood\s+draw|phlebotomy/gi,
      /vital\s+signs/gi,
      /physical\s+exam/gi,
      /ecg|electrocardiogram/gi,
      /x-?ray|ct\s+scan|mri|imaging/gi,
      /biopsy/gi,
      /questionnaire|survey/gi,
      /pk\s+sampling|pharmacokinetic/gi
    ];

    let totalProcedures = 0;
    procedurePatterns.forEach(pattern => {
      totalProcedures += (text.match(pattern) || []).length;
    });

    return Math.min(30, Math.max(1, totalProcedures / 2)); // Average per visit
  }

  private static countPrimaryEndpoints(text: string): number {
    const primaryPattern = /primary\s+endpoint[s]?[\s\S]*?(?=secondary|safety|statistical)/i;
    const match = text.match(primaryPattern);
    
    if (!match) return 1; // Assume at least one

    const endpointText = match[0];
    const counts = [
      (endpointText.match(/\d+\./g) || []).length,
      (endpointText.match(/•|\*|-\s/g) || []).length,
      (endpointText.match(/\band\b/gi) || []).length,
    ];

    return Math.max(1, Math.min(5, Math.max(...counts)));
  }

  private static countSecondaryEndpoints(text: string): number {
    const secondaryPattern = /secondary\s+endpoint[s]?[\s\S]*?(?=safety|statistical|exploratory)/i;
    const match = text.match(secondaryPattern);
    
    if (!match) return 0;

    const endpointText = match[0];
    const counts = [
      (endpointText.match(/\d+\./g) || []).length,
      (endpointText.match(/•|\*|-\s/g) || []).length,
      (endpointText.match(/\band\b/gi) || []).length / 2,
    ];

    return Math.min(20, Math.max(...counts));
  }

  private static countExploratoryEndpoints(text: string): number {
    const exploratoryPattern = /exploratory\s+endpoint[s]?|biomarker|pharmacokinetic|pharmacodynamic/gi;
    return Math.min(15, (text.match(exploratoryPattern) || []).length);
  }

  private static countLabRequirements(text: string): number {
    const labPatterns = [
      /complete\s+blood\s+count|cbc/gi,
      /liver\s+function|alt|ast/gi,
      /kidney\s+function|creatinine|bun/gi,
      /glucose|hemoglobin|platelet/gi,
      /biomarker|protein\s+level/gi
    ];

    let totalLabs = 0;
    labPatterns.forEach(pattern => {
      totalLabs += (text.match(pattern) || []).length;
    });

    return Math.min(25, totalLabs);
  }

  private static countImagingRequirements(text: string): number {
    const imagingPatterns = [
      /ct\s+scan|computed\s+tomography/gi,
      /mri|magnetic\s+resonance/gi,
      /x-?ray/gi,
      /ultrasound|echocardiogram/gi,
      /pet\s+scan|positron\s+emission/gi
    ];

    let totalImaging = 0;
    imagingPatterns.forEach(pattern => {
      totalImaging += (text.match(pattern) || []).length;
    });

    return Math.min(10, totalImaging);
  }

  private static countConditionalLogic(text: string): number {
    const conditionalPatterns = [
      /if\s+[\w\s]+\s+then/gi,
      /in\s+case\s+of/gi,
      /depending\s+on/gi,
      /based\s+on\s+the\s+result/gi,
      /contingent/gi
    ];

    let totalConditionals = 0;
    conditionalPatterns.forEach(pattern => {
      totalConditionals += (text.match(pattern) || []).length;
    });

    return Math.min(20, totalConditionals);
  }

  private static countStudyArms(text: string): number {
    const armPatterns = [
      /arm\s+\d+|group\s+\d+/gi,
      /treatment\s+\d+/gi,
      /cohort\s+\d+/gi,
      /placebo|control\s+group/gi
    ];

    const arms = new Set<string>();
    armPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => arms.add(match.toLowerCase()));
    });

    return Math.max(1, Math.min(10, arms.size));
  }

  private static countCohorts(text: string): number {
    const cohortPattern = /cohort\s+\d+/gi;
    const matches = text.match(cohortPattern) || [];
    return Math.min(5, matches.length || 1);
  }

  private static hasAdaptiveElements(text: string): boolean {
    const adaptivePatterns = [
      /adaptive/gi,
      /interim\s+analysis/gi,
      /dose\s+escalation/gi,
      /futility\s+analysis/gi,
      /sample\s+size\s+re-?estimation/gi
    ];

    return adaptivePatterns.some(pattern => pattern.test(text));
  }

  private static countInterimAnalyses(text: string): number {
    const interimPattern = /interim\s+analysis/gi;
    return Math.min(5, (text.match(interimPattern) || []).length);
  }

  // Sub-score calculators (each returns 0-100)
  private static calculateEligibilityScore(factors: ComplexityFactors): number {
    const total = factors.inclusionCriteria + factors.exclusionCriteria;
    if (total <= 5) return 20;
    if (total <= 10) return 40;
    if (total <= 15) return 60;
    if (total <= 25) return 80;
    return 100;
  }

  private static calculateVisitsScore(factors: ComplexityFactors): number {
    const frequencyMultiplier = {
      daily: 2.0,
      weekly: 1.5,
      biweekly: 1.2,
      monthly: 1.0,
      quarterly: 0.8
    };

    const adjustedVisits = factors.totalVisits * frequencyMultiplier[factors.visitFrequency];
    
    if (adjustedVisits <= 5) return 20;
    if (adjustedVisits <= 10) return 40;
    if (adjustedVisits <= 15) return 60;
    if (adjustedVisits <= 25) return 80;
    return 100;
  }

  private static calculateEndpointsScore(factors: ComplexityFactors): number {
    const total = factors.primaryEndpoints + factors.secondaryEndpoints + factors.exploratoryEndpoints;
    if (total <= 3) return 20;
    if (total <= 8) return 40;
    if (total <= 15) return 60;
    if (total <= 25) return 80;
    return 100;
  }

  private static calculateProceduresScore(factors: ComplexityFactors): number {
    const total = factors.proceduresPerVisit + factors.labRequirements + factors.imagingRequirements;
    if (total <= 5) return 20;
    if (total <= 12) return 40;
    if (total <= 20) return 60;
    if (total <= 30) return 80;
    return 100;
  }

  private static calculateLengthScore(factors: ComplexityFactors): number {
    const wordCount = factors.protocolWordCount;
    if (wordCount <= 5000) return 20;
    if (wordCount <= 15000) return 40;
    if (wordCount <= 30000) return 60;
    if (wordCount <= 50000) return 80;
    return 100;
  }

  private static calculateLogicScore(factors: ComplexityFactors): number {
    let score = 0;
    
    // Base score from conditional statements
    score += Math.min(50, factors.conditionalStatements * 5);
    
    // Add complexity for multiple arms/cohorts
    if (factors.studyArms > 2) score += 20;
    if (factors.cohorts > 1) score += 15;
    
    // Adaptive elements add significant complexity
    if (factors.adaptiveElements) score += 25;
    
    // Interim analyses add complexity
    score += factors.interimAnalyses * 10;

    return Math.min(100, score);
  }

  private static categorizeComplexity(score: number): ComplexityScore['category'] {
    if (score <= 25) return 'Simple';
    if (score <= 50) return 'Moderate';
    if (score <= 75) return 'Complex';
    return 'Highly Complex';
  }

  private static generateRecommendations(factors: ComplexityFactors, breakdown: ComplexityScore['breakdown']): string[] {
    const recommendations: string[] = [];

    if (breakdown.eligibility > 70) {
      recommendations.push(`Consider reducing eligibility criteria from ${factors.inclusionCriteria + factors.exclusionCriteria} to under 15 total`);
    }

    if (breakdown.visits > 70) {
      recommendations.push(`Visit schedule is intensive (${factors.totalVisits} visits) - consider reducing frequency or combining visits`);
    }

    if (breakdown.procedures > 70) {
      recommendations.push(`High procedure burden - consider which assessments are truly necessary for endpoints`);
    }

    if (breakdown.logic > 70) {
      recommendations.push(`Complex conditional logic detected - simplify decision trees where possible`);
    }

    if (factors.adaptiveElements && Object.values(breakdown).some(score => score > 70)) {
      recommendations.push(`Adaptive design adds significant complexity - ensure operational feasibility`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Protocol complexity is well-balanced for the study objectives');
    }

    return recommendations;
  }

  private static calculatePercentile(score: number, factors: ComplexityFactors): number {
    // Simplified percentile calculation based on score ranges
    // In real implementation, this would query actual database of protocols
    
    if (score <= 30) return 25;
    if (score <= 45) return 50;
    if (score <= 65) return 75;
    if (score <= 80) return 90;
    return 95;
  }
}