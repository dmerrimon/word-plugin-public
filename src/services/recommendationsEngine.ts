/**
 * Smart Recommendations Engine
 * Generates prioritized protocol optimization suggestions based on intelligence analysis
 */

export interface SmartRecommendation {
  id: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Complexity' | 'Enrollment' | 'Burden' | 'Benchmarking' | 'Regulatory';
  title: string;
  description: string;
  expectedImpact: {
    metric: string;
    currentValue: number;
    projectedValue: number;
    improvement: string;
  };
  implementationEffort: 'Easy' | 'Moderate' | 'Difficult';
  timeToImplement: string;
  industryExample?: string;
  oneClickFix?: boolean;
  fixAction?: () => void;
}

export interface RecommendationSummary {
  overallProtocolHealth: number; // 0-100
  topRecommendations: SmartRecommendation[];
  quickWins: SmartRecommendation[];
  strategicImprovements: SmartRecommendation[];
  totalPotentialImprovement: number;
  estimatedTimeToOptimize: string;
}

export class RecommendationsEngine {

  /**
   * Generate comprehensive recommendations based on all intelligence modules
   */
  static generateRecommendations(
    complexityScore: any,
    enrollmentAnalysis: any,
    visitBurden: any,
    benchmarkData: any
  ): RecommendationSummary {
    
    const allRecommendations: SmartRecommendation[] = [];

    // Generate recommendations from each module
    allRecommendations.push(...this.generateComplexityRecommendations(complexityScore));
    allRecommendations.push(...this.generateEnrollmentRecommendations(enrollmentAnalysis));
    allRecommendations.push(...this.generateBurdenRecommendations(visitBurden));
    allRecommendations.push(...this.generateBenchmarkingRecommendations(benchmarkData));

    // Sort by priority and impact
    const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);
    
    // Categorize recommendations
    const topRecommendations = prioritizedRecommendations.slice(0, 5);
    const quickWins = prioritizedRecommendations.filter(r => 
      r.implementationEffort === 'Easy' && r.priority !== 'Low'
    ).slice(0, 3);
    const strategicImprovements = prioritizedRecommendations.filter(r => 
      r.priority === 'Critical' || r.priority === 'High'
    ).slice(0, 3);

    const overallProtocolHealth = this.calculateProtocolHealth(
      complexityScore, enrollmentAnalysis, visitBurden, benchmarkData
    );

    const totalPotentialImprovement = this.calculateTotalImprovement(topRecommendations);
    const estimatedTimeToOptimize = this.estimateOptimizationTime(topRecommendations);

    return {
      overallProtocolHealth,
      topRecommendations,
      quickWins,
      strategicImprovements,
      totalPotentialImprovement,
      estimatedTimeToOptimize
    };
  }

  private static generateComplexityRecommendations(complexityScore: any): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    if (complexityScore.breakdown.eligibility > 70) {
      recommendations.push({
        id: 'reduce-eligibility-criteria',
        priority: 'High',
        category: 'Complexity',
        title: 'Reduce Eligibility Criteria Complexity',
        description: `Your protocol has ${complexityScore.factors?.inclusionCriteria + complexityScore.factors?.exclusionCriteria || 'many'} eligibility criteria, creating enrollment barriers.`,
        expectedImpact: {
          metric: 'Eligibility Complexity',
          currentValue: complexityScore.breakdown.eligibility,
          projectedValue: Math.max(50, complexityScore.breakdown.eligibility - 20),
          improvement: 'Reduce screen failure rate by 15-25%'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '2-3 weeks',
        industryExample: 'Moderna COVID-19 vaccine trial reduced criteria from 23 to 12, improving enrollment by 40%',
        oneClickFix: false
      });
    }

    if (complexityScore.breakdown.visits > 75) {
      recommendations.push({
        id: 'optimize-visit-schedule',
        priority: 'High',
        category: 'Complexity',
        title: 'Optimize Visit Schedule',
        description: 'Intensive visit schedule may impact patient compliance and site burden.',
        expectedImpact: {
          metric: 'Visit Complexity',
          currentValue: complexityScore.breakdown.visits,
          projectedValue: Math.max(50, complexityScore.breakdown.visits - 25),
          improvement: 'Reduce patient dropout by 20%'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '1-2 weeks',
        industryExample: 'Pfizer oncology trials combined 3 early visits into 2, maintaining data quality',
        oneClickFix: false
      });
    }

    if (complexityScore.breakdown.procedures > 80) {
      recommendations.push({
        id: 'streamline-procedures',
        priority: 'Medium',
        category: 'Complexity',
        title: 'Streamline Procedure Requirements',
        description: 'High procedure burden per visit may overwhelm patients and sites.',
        expectedImpact: {
          metric: 'Procedure Complexity',
          currentValue: complexityScore.breakdown.procedures,
          projectedValue: Math.max(60, complexityScore.breakdown.procedures - 15),
          improvement: 'Reduce visit duration by 30 minutes'
        },
        implementationEffort: 'Easy',
        timeToImplement: '1 week',
        oneClickFix: false
      });
    }

    if (complexityScore.breakdown.logic > 75) {
      recommendations.push({
        id: 'simplify-conditional-logic',
        priority: 'Medium',
        category: 'Complexity',
        title: 'Simplify Conditional Logic',
        description: 'Complex if/then statements create operational challenges for sites.',
        expectedImpact: {
          metric: 'Logic Complexity',
          currentValue: complexityScore.breakdown.logic,
          projectedValue: Math.max(50, complexityScore.breakdown.logic - 25),
          improvement: 'Reduce protocol deviations by 30%'
        },
        implementationEffort: 'Difficult',
        timeToImplement: '3-4 weeks',
        oneClickFix: false
      });
    }

    return recommendations;
  }

  private static generateEnrollmentRecommendations(enrollmentAnalysis: any): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    if (enrollmentAnalysis.difficulty === 'Difficult' || enrollmentAnalysis.difficulty === 'Challenging') {
      recommendations.push({
        id: 'improve-enrollment-feasibility',
        priority: 'Critical',
        category: 'Enrollment',
        title: 'Address Enrollment Barriers',
        description: `Enrollment is predicted to be ${enrollmentAnalysis.difficulty.toLowerCase()} with ${enrollmentAnalysis.estimatedMonths} months timeline.`,
        expectedImpact: {
          metric: 'Enrollment Timeline',
          currentValue: enrollmentAnalysis.estimatedMonths,
          projectedValue: Math.max(6, enrollmentAnalysis.estimatedMonths - 4),
          improvement: 'Accelerate enrollment by 4-6 months'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '2-4 weeks',
        industryExample: 'Roche broadened HER2+ criteria, reducing enrollment time from 18 to 12 months'
      });
    }

    if (enrollmentAnalysis.screenFailureRate > 50) {
      recommendations.push({
        id: 'reduce-screen-failure',
        priority: 'High',
        category: 'Enrollment',
        title: 'Reduce Screen Failure Rate',
        description: `High screen failure rate (${enrollmentAnalysis.screenFailureRate}%) indicates overly restrictive criteria.`,
        expectedImpact: {
          metric: 'Screen Failure Rate',
          currentValue: enrollmentAnalysis.screenFailureRate,
          projectedValue: Math.max(25, enrollmentAnalysis.screenFailureRate - 15),
          improvement: 'Increase enrollment efficiency by 25%'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '2-3 weeks',
        oneClickFix: false
      });
    }

    if (enrollmentAnalysis.recommendedSites > 30) {
      recommendations.push({
        id: 'optimize-site-strategy',
        priority: 'Medium',
        category: 'Enrollment',
        title: 'Optimize Site Selection Strategy',
        description: `Large number of recommended sites (${enrollmentAnalysis.recommendedSites}) suggests enrollment challenges.`,
        expectedImpact: {
          metric: 'Required Sites',
          currentValue: enrollmentAnalysis.recommendedSites,
          projectedValue: Math.max(15, enrollmentAnalysis.recommendedSites - 10),
          improvement: 'Reduce operational complexity'
        },
        implementationEffort: 'Easy',
        timeToImplement: '1 week',
        oneClickFix: false
      });
    }

    return recommendations;
  }

  private static generateBurdenRecommendations(visitBurden: any): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    if (visitBurden.patientBurdenScore > 70) {
      recommendations.push({
        id: 'reduce-patient-burden',
        priority: 'High',
        category: 'Burden',
        title: 'Reduce Patient Burden',
        description: `High patient burden score (${visitBurden.patientBurdenScore}/100) may impact compliance and retention.`,
        expectedImpact: {
          metric: 'Patient Burden',
          currentValue: visitBurden.patientBurdenScore,
          projectedValue: Math.max(50, visitBurden.patientBurdenScore - 20),
          improvement: 'Improve retention by 15-20%'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '2-3 weeks',
        industryExample: 'Novartis implemented home nursing visits, reducing patient burden by 30%'
      });
    }

    if (visitBurden.complianceRisk > 50) {
      recommendations.push({
        id: 'improve-compliance-risk',
        priority: 'High',
        category: 'Burden',
        title: 'Address Compliance Risk Factors',
        description: `High dropout risk (${visitBurden.complianceRisk}%) threatens study completion.`,
        expectedImpact: {
          metric: 'Dropout Risk',
          currentValue: visitBurden.complianceRisk,
          projectedValue: Math.max(25, visitBurden.complianceRisk - 15),
          improvement: 'Reduce dropout rate by 15%'
        },
        implementationEffort: 'Moderate',
        timeToImplement: '2-4 weeks',
        oneClickFix: false
      });
    }

    if (visitBurden.totalStudyTime > 50) {
      recommendations.push({
        id: 'optimize-time-commitment',
        priority: 'Medium',
        category: 'Burden',
        title: 'Optimize Total Time Commitment',
        description: `Extensive time commitment (${visitBurden.totalStudyTime} hours) may deter participation.`,
        expectedImpact: {
          metric: 'Total Study Time',
          currentValue: visitBurden.totalStudyTime,
          projectedValue: Math.max(30, visitBurden.totalStudyTime - 10),
          improvement: 'Reduce time burden by 20%'
        },
        implementationEffort: 'Easy',
        timeToImplement: '1-2 weeks',
        oneClickFix: false
      });
    }

    return recommendations;
  }

  private static generateBenchmarkingRecommendations(benchmarkData: any): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    if (benchmarkData?.outliers) {
      benchmarkData.outliers.forEach((outlier: any, index: number) => {
        if (outlier.severity === 'Critical') {
          recommendations.push({
            id: `benchmark-critical-${index}`,
            priority: 'Critical',
            category: 'Benchmarking',
            title: `Address ${outlier.metric} Outlier`,
            description: outlier.message,
            expectedImpact: {
              metric: outlier.metric,
              currentValue: 95, // Outlier percentile
              projectedValue: 75,
              improvement: 'Align with industry standards'
            },
            implementationEffort: 'Difficult',
            timeToImplement: '3-6 weeks',
            industryExample: outlier.prevalence
          });
        }
      });
    }

    return recommendations;
  }

  private static prioritizeRecommendations(recommendations: SmartRecommendation[]): SmartRecommendation[] {
    const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    const effortOrder = { 'Easy': 3, 'Moderate': 2, 'Difficult': 1 };

    return recommendations.sort((a, b) => {
      // Primary sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort by implementation effort (easier first)
      return effortOrder[b.implementationEffort] - effortOrder[a.implementationEffort];
    });
  }

  private static calculateProtocolHealth(
    complexityScore: any,
    enrollmentAnalysis: any,
    visitBurden: any,
    benchmarkData: any
  ): number {
    // Weighted health score calculation
    const complexityHealth = Math.max(0, 100 - complexityScore.overall);
    const enrollmentHealth = enrollmentAnalysis.difficulty === 'Easy' ? 90 :
                           enrollmentAnalysis.difficulty === 'Moderate' ? 70 :
                           enrollmentAnalysis.difficulty === 'Challenging' ? 50 : 30;
    const burdenHealth = Math.max(0, 100 - ((visitBurden.patientBurdenScore + visitBurden.complianceRisk) / 2));
    const benchmarkHealth = benchmarkData?.overallScore || 60;

    const weights = { complexity: 0.25, enrollment: 0.35, burden: 0.25, benchmark: 0.15 };

    return Math.round(
      complexityHealth * weights.complexity +
      enrollmentHealth * weights.enrollment +
      burdenHealth * weights.burden +
      benchmarkHealth * weights.benchmark
    );
  }

  private static calculateTotalImprovement(recommendations: SmartRecommendation[]): number {
    return recommendations.reduce((total, rec) => {
      const improvement = rec.expectedImpact.currentValue - rec.expectedImpact.projectedValue;
      return total + Math.max(0, improvement);
    }, 0);
  }

  private static estimateOptimizationTime(recommendations: SmartRecommendation[]): string {
    const timeMap = { 'Easy': 1, 'Moderate': 3, 'Difficult': 6 };
    const totalWeeks = recommendations.reduce((total, rec) => {
      const baseTime = timeMap[rec.implementationEffort];
      const priorityMultiplier = rec.priority === 'Critical' ? 1.5 : 1;
      return total + (baseTime * priorityMultiplier);
    }, 0);

    if (totalWeeks <= 4) return `${Math.ceil(totalWeeks)} weeks`;
    if (totalWeeks <= 12) return `${Math.ceil(totalWeeks / 4)} months`;
    return `${Math.ceil(totalWeeks / 12)} quarters`;
  }

  /**
   * Generate one-click fixes for simple optimizations
   */
  static generateQuickFixes(protocolText: string): SmartRecommendation[] {
    const quickFixes: SmartRecommendation[] = [];

    // Check for common optimization opportunities
    if (protocolText.includes('must have documented')) {
      quickFixes.push({
        id: 'soften-documentation-requirements',
        priority: 'Medium',
        category: 'Complexity',
        title: 'Soften Documentation Requirements',
        description: 'Replace "must have documented" with "should have available records of"',
        expectedImpact: {
          metric: 'Enrollment Barriers',
          currentValue: 100,
          projectedValue: 85,
          improvement: 'Reduce screen failures by 10-15%'
        },
        implementationEffort: 'Easy',
        timeToImplement: 'Immediate',
        oneClickFix: true
      });
    }

    if (protocolText.includes('within 24 hours')) {
      quickFixes.push({
        id: 'extend-time-windows',
        priority: 'Medium',
        category: 'Complexity',
        title: 'Extend Time Windows',
        description: 'Replace "within 24 hours" with "within 48-72 hours" for better feasibility',
        expectedImpact: {
          metric: 'Operational Complexity',
          currentValue: 100,
          projectedValue: 80,
          improvement: 'Improve site compliance by 20%'
        },
        implementationEffort: 'Easy',
        timeToImplement: 'Immediate',
        oneClickFix: true
      });
    }

    return quickFixes;
  }
}