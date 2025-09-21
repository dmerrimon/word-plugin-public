import * as React from "react";
import { ComplexityAnalyzer, ComplexityScore } from "../../services/complexityAnalyzer";
import { EnrollmentPredictor, EnrollmentFeasibility } from "../../services/enrollmentPredictor";
import { VisitBurdenCalculator, VisitBurdenAnalysis } from "../../services/visitBurden";

export interface ProtocolIntelligenceProps {
  protocolText: string;
  isAnalyzing: boolean;
  onExportReport: () => void;
}

export const ProtocolIntelligence: React.FC<ProtocolIntelligenceProps> = ({
  protocolText,
  isAnalyzing,
  onExportReport
}) => {
  const [analysis, setAnalysis] = React.useState<{
    complexity: ComplexityScore | null;
    enrollment: EnrollmentFeasibility | null;
    visitBurden: VisitBurdenAnalysis | null;
  }>({
    complexity: null,
    enrollment: null,
    visitBurden: null
  });

  const [activeTab, setActiveTab] = React.useState<'overview' | 'complexity' | 'enrollment' | 'burden'>('overview');

  React.useEffect(() => {
    if (protocolText && protocolText.length > 100) {
      analyzeProtocol(protocolText);
    }
  }, [protocolText]);

  const analyzeProtocol = (text: string) => {
    try {
      // Complexity Analysis
      const complexityFactors = ComplexityAnalyzer.analyzeProtocolText(text);
      const complexityScore = ComplexityAnalyzer.calculateComplexityScore(complexityFactors);

      // Enrollment Analysis
      const enrollmentFactors = EnrollmentPredictor.extractEnrollmentFactors(text);
      const enrollmentFeasibility = EnrollmentPredictor.calculateEnrollmentFeasibility(enrollmentFactors);

      // Visit Burden Analysis
      const visitFactors = VisitBurdenCalculator.extractVisitFactors(text);
      const visitBurdenAnalysis = VisitBurdenCalculator.calculateVisitBurden(visitFactors);

      setAnalysis({
        complexity: complexityScore,
        enrollment: enrollmentFeasibility,
        visitBurden: visitBurdenAnalysis
      });
    } catch (error) {
      console.error('Error analyzing protocol:', error);
    }
  };

  const calculateOverallScore = (): number => {
    if (!analysis.complexity || !analysis.enrollment || !analysis.visitBurden) return 0;
    
    // Weighted overall intelligence score
    const complexityWeight = 0.3;
    const enrollmentWeight = 0.4;
    const burdenWeight = 0.3;

    // Convert different metrics to 0-100 scale
    const complexityContribution = (100 - analysis.complexity.overall) * complexityWeight; // Lower complexity = higher score
    const enrollmentContribution = (analysis.enrollment.difficulty === 'Easy' ? 85 : 
                                  analysis.enrollment.difficulty === 'Moderate' ? 65 :
                                  analysis.enrollment.difficulty === 'Challenging' ? 45 : 25) * enrollmentWeight;
    const burdenContribution = (100 - analysis.visitBurden.patientBurdenScore) * burdenWeight; // Lower burden = higher score

    return Math.round(complexityContribution + enrollmentContribution + burdenContribution);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#22c55e"; // Green
    if (score >= 60) return "#84cc16"; // Light green
    if (score >= 40) return "#eab308"; // Yellow
    if (score >= 20) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const renderOverviewTab = () => {
    const overallScore = calculateOverallScore();
    
    if (!analysis.complexity || !analysis.enrollment || !analysis.visitBurden) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>📊</div>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Select protocol text to see intelligence analysis
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: "16px" }}>
        {/* Overall Score */}
        <div style={{
          padding: "16px",
          background: `linear-gradient(135deg, ${getScoreColor(overallScore)}20, ${getScoreColor(overallScore)}10)`,
          border: `2px solid ${getScoreColor(overallScore)}`,
          borderRadius: "8px",
          marginBottom: "16px",
          textAlign: "center"
        }}>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "18px", 
            fontWeight: "700",
            color: getScoreColor(overallScore)
          }}>
            Protocol Intelligence Score: {overallScore}/100
          </h2>
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            overflow: "hidden",
            marginTop: "8px"
          }}>
            <div style={{
              width: `${overallScore}%`,
              height: "100%",
              backgroundColor: getScoreColor(overallScore),
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px"
        }}>
          {/* Complexity */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fef3f2",
            border: "2px solid #fecaca",
            borderRadius: "6px"
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626", marginBottom: "4px" }}>
              📊 COMPLEXITY
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b" }}>
              {analysis.complexity.category} ({analysis.complexity.overall}/100)
            </div>
            <div style={{ fontSize: "10px", color: "#7f1d1d", marginTop: "2px" }}>
              {analysis.complexity.percentile}th percentile
            </div>
          </div>

          {/* Enrollment */}
          <div style={{
            padding: "12px",
            backgroundColor: "#fffbeb",
            border: "2px solid #fde68a",
            borderRadius: "6px"
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#d97706", marginBottom: "4px" }}>
              ⏱️ ENROLLMENT
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#92400e" }}>
              {analysis.enrollment.difficulty}
            </div>
            <div style={{ fontSize: "10px", color: "#78350f", marginTop: "2px" }}>
              {analysis.enrollment.estimatedMonths} months estimated
            </div>
          </div>

          {/* Patient Burden */}
          <div style={{
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "2px solid #bbf7d0",
            borderRadius: "6px"
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", marginBottom: "4px" }}>
              👥 PATIENT BURDEN
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#15803d" }}>
              {analysis.visitBurden.overallBurden}
            </div>
            <div style={{ fontSize: "10px", color: "#166534", marginTop: "2px" }}>
              {analysis.visitBurden.totalVisits} visits, {analysis.visitBurden.totalStudyTime}h total
            </div>
          </div>

          {/* Compliance Risk */}
          <div style={{
            padding: "12px",
            backgroundColor: "#f8fafc",
            border: "2px solid #cbd5e1",
            borderRadius: "6px"
          }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
              📈 COMPLIANCE RISK
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              {analysis.visitBurden.complianceRisk}% risk
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
              Dropout prediction
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "2px solid #0ea5e9",
          borderRadius: "6px"
        }}>
          <h4 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "12px", 
            fontWeight: "700",
            color: "#0c4a6e",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            💡 TOP RECOMMENDATIONS
          </h4>
          <div style={{ fontSize: "11px", color: "#075985", lineHeight: "1.4" }}>
            {analysis.complexity.recommendations.slice(0, 1).map((rec, index) => (
              <div key={`complexity-${index}`} style={{ marginBottom: "4px" }}>
                • {rec}
              </div>
            ))}
            {analysis.enrollment.recommendations.slice(0, 1).map((rec, index) => (
              <div key={`enrollment-${index}`} style={{ marginBottom: "4px" }}>
                • {rec}
              </div>
            ))}
            {analysis.visitBurden.recommendations.slice(0, 1).map((rec, index) => (
              <div key={`burden-${index}`} style={{ marginBottom: "4px" }}>
                • {rec.description}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          marginTop: "16px",
          justifyContent: "center"
        }}>
          <button
            onClick={onExportReport}
            style={{
              padding: "10px 16px",
              fontSize: "12px",
              fontWeight: "600",
              color: "white",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>📄</span>
            Export Intelligence Report
          </button>
        </div>
      </div>
    );
  };

  const renderComplexityTab = () => {
    if (!analysis.complexity) return null;

    return (
      <div style={{ padding: "16px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
          📊 Protocol Complexity Analysis
        </h3>

        {/* Overall Score */}
        <div style={{
          padding: "12px",
          backgroundColor: "#fef2f2",
          border: "2px solid #fecaca",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#dc2626" }}>
              Overall Complexity: {analysis.complexity.category}
            </span>
            <span style={{ fontSize: "18px", fontWeight: "700", color: "#dc2626" }}>
              {analysis.complexity.overall}/100
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "#7f1d1d", marginTop: "4px" }}>
            {analysis.complexity.percentile}th percentile compared to similar protocols
          </div>
        </div>

        {/* Breakdown Scores */}
        <div style={{ marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
            Complexity Breakdown:
          </h4>
          {Object.entries(analysis.complexity.breakdown).map(([factor, score]) => (
            <div key={factor} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontSize: "12px", textTransform: "capitalize" }}>
                  {factor.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>{score}/100</span>
              </div>
              <div style={{
                width: "100%",
                height: "4px",
                backgroundColor: "#e5e7eb",
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${score}%`,
                  height: "100%",
                  backgroundColor: getScoreColor(100 - score),
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "2px solid #0ea5e9",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#0c4a6e" }}>
            Complexity Recommendations:
          </h4>
          {analysis.complexity.recommendations.map((rec, index) => (
            <div key={index} style={{ 
              fontSize: "11px", 
              color: "#075985", 
              marginBottom: "4px",
              lineHeight: "1.4"
            }}>
              • {rec}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnrollmentTab = () => {
    if (!analysis.enrollment) return null;

    return (
      <div style={{ padding: "16px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
          ⏱️ Enrollment Feasibility Analysis
        </h3>

        {/* Key Metrics */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px"
        }}>
          <div style={{
            padding: "12px",
            backgroundColor: "#fffbeb",
            border: "2px solid #fde68a",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#d97706" }}>
              {analysis.enrollment.estimatedMonths}
            </div>
            <div style={{ fontSize: "11px", color: "#92400e" }}>
              Months to Complete
            </div>
          </div>

          <div style={{
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "2px solid #fecaca",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#dc2626" }}>
              {analysis.enrollment.screenFailureRate}%
            </div>
            <div style={{ fontSize: "11px", color: "#991b1b" }}>
              Screen Failure Rate
            </div>
          </div>
        </div>

        {/* Sites Recommendation */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f0fdf4",
          border: "2px solid #bbf7d0",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a", marginBottom: "4px" }}>
            Recommended Sites: {analysis.enrollment.recommendedSites}
          </div>
          <div style={{ fontSize: "11px", color: "#15803d" }}>
            Based on enrollment timeline and patient availability
          </div>
        </div>

        {/* Risk Factors */}
        {analysis.enrollment.riskFactors.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
              Enrollment Risk Factors:
            </h4>
            {analysis.enrollment.riskFactors.map((risk, index) => (
              <div key={index} style={{
                padding: "8px",
                backgroundColor: risk.impact === 'High' ? "#fef2f2" : 
                                 risk.impact === 'Medium' ? "#fffbeb" : "#f9fafb",
                border: `2px solid ${risk.impact === 'High' ? "#fecaca" : 
                                    risk.impact === 'Medium' ? "#fde68a" : "#e5e7eb"}`,
                borderRadius: "4px",
                marginBottom: "6px"
              }}>
                <div style={{ 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: risk.impact === 'High' ? "#dc2626" : 
                         risk.impact === 'Medium' ? "#d97706" : "#374151",
                  marginBottom: "2px"
                }}>
                  {risk.factor} ({risk.impact} Impact)
                </div>
                <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "2px" }}>
                  {risk.description}
                </div>
                <div style={{ fontSize: "10px", color: "#059669", fontStyle: "italic" }}>
                  Mitigation: {risk.mitigation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "2px solid #0ea5e9",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#0c4a6e" }}>
            Enrollment Recommendations:
          </h4>
          {analysis.enrollment.recommendations.map((rec, index) => (
            <div key={index} style={{ 
              fontSize: "11px", 
              color: "#075985", 
              marginBottom: "4px",
              lineHeight: "1.4"
            }}>
              • {rec}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBurdenTab = () => {
    if (!analysis.visitBurden) return null;

    return (
      <div style={{ padding: "16px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
          👥 Visit Burden Analysis
        </h3>

        {/* Burden Scores */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px"
        }}>
          <div style={{
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "2px solid #bbf7d0",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#16a34a" }}>
              {analysis.visitBurden.patientBurdenScore}
            </div>
            <div style={{ fontSize: "11px", color: "#15803d" }}>
              Patient Burden Score
            </div>
          </div>

          <div style={{
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "2px solid #fecaca",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#dc2626" }}>
              {analysis.visitBurden.complianceRisk}%
            </div>
            <div style={{ fontSize: "11px", color: "#991b1b" }}>
              Dropout Risk
            </div>
          </div>
        </div>

        {/* Visit Summary */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f8fafc",
          border: "2px solid #cbd5e1",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
            Visit Summary:
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>
            • Total visits: {analysis.visitBurden.totalVisits}<br/>
            • Average time per visit: {analysis.visitBurden.estimatedTimePerVisit} minutes<br/>
            • Total study time: {analysis.visitBurden.totalStudyTime} hours<br/>
            • Overall burden: {analysis.visitBurden.overallBurden}
          </div>
        </div>

        {/* Visit Details */}
        {analysis.visitBurden.visitDetails.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
              Key Visits:
            </h4>
            {analysis.visitBurden.visitDetails.slice(0, 3).map((visit, index) => (
              <div key={index} style={{
                padding: "8px",
                backgroundColor: "#f9fafb",
                border: "2px solid #e5e7eb",
                borderRadius: "4px",
                marginBottom: "6px"
              }}>
                <div style={{ 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  color: "#374151",
                  marginBottom: "2px"
                }}>
                  {visit.visitName} ({visit.timepoint})
                </div>
                <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "2px" }}>
                  {visit.procedures.slice(0, 3).join(', ')}
                  {visit.procedures.length > 3 ? `... +${visit.procedures.length - 3} more` : ''}
                </div>
                <div style={{ fontSize: "10px", color: "#059669" }}>
                  Estimated time: {visit.estimatedTime} minutes
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div style={{
          padding: "12px",
          backgroundColor: "#f0f9ff",
          border: "2px solid #0ea5e9",
          borderRadius: "6px"
        }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "600", color: "#0c4a6e" }}>
            Burden Reduction Recommendations:
          </h4>
          {analysis.visitBurden.recommendations.map((rec, index) => (
            <div key={index} style={{ 
              fontSize: "11px", 
              color: "#075985", 
              marginBottom: "4px",
              lineHeight: "1.4"
            }}>
              • {rec.description} (Expected reduction: {rec.expectedReduction}%)
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isAnalyzing) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{ fontSize: "32px" }}>🧠</div>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
          Analyzing Protocol Intelligence
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
          Evaluating complexity, enrollment feasibility, and visit burden...
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid #e5e7eb",
        backgroundColor: "#f9fafb"
      }}>
        {[
          { key: 'overview', label: '📊 Overview', icon: '📊' },
          { key: 'complexity', label: '🔧 Complexity', icon: '🔧' },
          { key: 'enrollment', label: '⏱️ Enrollment', icon: '⏱️' },
          { key: 'burden', label: '👥 Burden', icon: '👥' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: "12px 8px",
              fontSize: "11px",
              fontWeight: "600",
              border: "none",
              backgroundColor: activeTab === tab.key ? "#2563eb" : "transparent",
              color: activeTab === tab.key ? "white" : "#6b7280",
              cursor: "pointer",
              borderBottom: activeTab === tab.key ? "2px solid #2563eb" : "none"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'complexity' && renderComplexityTab()}
        {activeTab === 'enrollment' && renderEnrollmentTab()}
        {activeTab === 'burden' && renderBurdenTab()}
      </div>
    </div>
  );
};