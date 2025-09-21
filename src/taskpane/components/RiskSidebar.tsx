import * as React from "react";

interface RiskFinding {
  phrase: string;
  risk_score: number;
  fix: string;
  reason?: string;
  evidence?: string;
  location?: string;
}

export interface RiskSidebarProps {
  findings: RiskFinding[];
  isAnalyzing: boolean;
}

export const RiskSidebar: React.FC<RiskSidebarProps> = ({ findings, isAnalyzing }) => {
  const getRiskColor = (score: number) => {
    if (score >= 85) return "#dc3545"; // Critical risk - red
    if (score >= 70) return "#fd7e14"; // High risk - orange  
    if (score >= 50) return "#ffc107"; // Medium risk - yellow
    return "#28a745"; // Low risk - green
  };

  const getRiskLevel = (score: number) => {
    if (score >= 85) return "CRITICAL";
    if (score >= 70) return "HIGH";
    if (score >= 50) return "MEDIUM";
    return "LOW";
  };

  const getRiskIcon = (score: number) => {
    if (score >= 85) return "🚨"; // Critical
    if (score >= 70) return "⚠️"; // High  
    if (score >= 50) return "⚡"; // Medium
    return "✅"; // Low
  };

  const getCategoryIcon = (phrase: string) => {
    const lowerPhrase = phrase.toLowerCase();
    if (lowerPhrase.includes('lab') || lowerPhrase.includes('value') || lowerPhrase.includes('range') || lowerPhrase.includes('test')) return '🔬';
    if (lowerPhrase.includes('visit') || lowerPhrase.includes('day') || lowerPhrase.includes('week') || lowerPhrase.includes('schedule')) return '📅';
    if (lowerPhrase.includes('dose') || lowerPhrase.includes('mg') || lowerPhrase.includes('treatment') || lowerPhrase.includes('drug')) return '💊';
    if (lowerPhrase.includes('inclusion') || lowerPhrase.includes('exclusion') || lowerPhrase.includes('eligibility') || lowerPhrase.includes('criteria')) return '📋';
    if (lowerPhrase.includes('infection') || lowerPhrase.includes('pathogen') || lowerPhrase.includes('antimicrobial') || lowerPhrase.includes('resistance')) return '🦠';
    return '📝';
  };

  // Group findings by risk level
  const groupedFindings = {
    critical: findings.filter(f => f.risk_score >= 85),
    high: findings.filter(f => f.risk_score >= 70 && f.risk_score < 85),
    medium: findings.filter(f => f.risk_score >= 50 && f.risk_score < 70),
    low: findings.filter(f => f.risk_score < 50)
  };

  const applySuggestion = async (finding: RiskFinding) => {
    // Check if Word APIs are available
    if (typeof Word === 'undefined') {
      // Browser mode - show demo message
      alert(`Demo: Would replace "${finding.phrase}" with "${finding.fix}"`);
      return;
    }

    try {
      await Word.run(async (context) => {
        // Find and replace the problematic phrase
        const results = context.document.body.search(finding.phrase, {
          matchCase: false,
          matchWholeWord: false
        });
        
        results.load("text");
        await context.sync();
        
        if (results.items.length > 0) {
          // Replace the first occurrence
          results.items[0].insertText(finding.fix, Word.InsertLocation.replace);
          await context.sync();
          
          // Show success message
          console.log(`Replaced "${finding.phrase}" with "${finding.fix}"`);
        }
      });
    } catch (error) {
      console.error("Error applying suggestion:", error);
    }
  };

  if (isAnalyzing) {
    return (
      <div style={{ 
        flex: 1, 
        padding: "16px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        gap: "8px"
      }}>
        <div style={{ fontSize: "24px" }}>⏳</div>
        <p style={{ fontSize: "12px", color: "#605e5c", margin: 0 }}>
          Analyzing protocol text...
        </p>
      </div>
    );
  }

  const renderRiskGroup = (groupName: string, groupFindings: RiskFinding[], groupColor: string, groupIcon: string) => {
    if (groupFindings.length === 0) return null;

    return (
      <div key={groupName} style={{ marginBottom: "16px" }}>
        <div style={{
          padding: "8px 12px",
          backgroundColor: groupColor,
          color: "white",
          fontWeight: "700",
          fontSize: "12px",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>{groupIcon}</span>
          {groupName.toUpperCase()} RISK ({groupFindings.length})
        </div>
        
        {groupFindings.map((finding, index) => (
          <div
            key={`${groupName}-${index}`}
            style={{
              margin: "0",
              padding: "12px",
              border: `2px solid ${groupColor}`,
              borderTop: "none",
              borderRadius: index === groupFindings.length - 1 ? "0 0 6px 6px" : "0",
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            {/* Risk Header with Category */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>{getCategoryIcon(finding.phrase)}</span>
                <span
                  style={{
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: getRiskColor(finding.risk_score),
                    borderRadius: "12px",
                    textTransform: "uppercase"
                  }}
                >
                  {getRiskLevel(finding.risk_score)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px" }}>{getRiskIcon(finding.risk_score)}</span>
                <span style={{ 
                  fontSize: "14px", 
                  fontWeight: "bold",
                  color: getRiskColor(finding.risk_score)
                }}>
                  {finding.risk_score}%
                </span>
              </div>
            </div>

            {/* Problematic Phrase */}
            <div style={{ marginBottom: "10px" }}>
              <h4 style={{ 
                margin: "0 0 6px 0", 
                fontSize: "12px", 
                fontWeight: "700",
                color: "#2d5aa0",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>🎯</span>
                High-Risk Protocol Language:
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: "11px", 
                padding: "8px 10px",
                backgroundColor: "#fff5f5",
                border: "2px solid #fed7d7",
                borderRadius: "6px",
                fontFamily: "monospace",
                color: "#c53030",
                fontWeight: "600"
              }}>
                "{finding.phrase}"
              </p>
            </div>

            {/* Suggested Fix */}
            <div style={{ marginBottom: "10px" }}>
              <h4 style={{ 
                margin: "0 0 6px 0", 
                fontSize: "12px", 
                fontWeight: "700",
                color: "#2d5aa0",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>🔧</span>
                Recommended Clinical Language:
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: "11px",
                padding: "8px 10px",
                backgroundColor: "#f0fff4",
                border: "2px solid #9ae6b4",
                borderRadius: "6px",
                fontFamily: "monospace",
                color: "#22543d",
                fontWeight: "600"
              }}>
                "{finding.fix}"
              </p>
            </div>

            {/* Clinical Rationale */}
            {finding.reason && (
              <div style={{ marginBottom: "10px" }}>
                <h4 style={{ 
                  margin: "0 0 6px 0", 
                  fontSize: "12px", 
                  fontWeight: "700",
                  color: "#2d5aa0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>🩺</span>
                  Clinical Impact:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: "11px",
                  color: "#4a5568",
                  lineHeight: "1.5",
                  padding: "6px 8px",
                  backgroundColor: "#f7fafc",
                  borderLeft: "4px solid #2d5aa0",
                  borderRadius: "0 4px 4px 0"
                }}>
                  {finding.reason}
                </p>
              </div>
            )}

            {/* Evidence */}
            {finding.evidence && (
              <div style={{ marginBottom: "10px" }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: "10px",
                  color: "#6b7280",
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>📚</span>
                  {finding.evidence}
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => applySuggestion(finding)}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: "700",
                color: "white",
                background: "linear-gradient(135deg, #2d5aa0, #1a4480)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "8px",
                boxShadow: "0 2px 4px rgba(45,90,160,0.3)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.target as HTMLButtonElement).style.boxShadow = "0 4px 8px rgba(45,90,160,0.4)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                (e.target as HTMLButtonElement).style.boxShadow = "0 2px 4px rgba(45,90,160,0.3)";
              }}
            >
              <span>🩹</span>
              Apply Clinical Fix
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (findings.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        padding: "24px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)"
      }}>
        <div style={{ fontSize: "32px" }}>🎯</div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ 
            fontSize: "14px", 
            color: "#2d5aa0", 
            margin: "0 0 6px 0",
            fontWeight: "700"
          }}>
            ID Protocol Analysis Ready
          </h3>
          <p style={{ 
            fontSize: "12px", 
            color: "#6c757d", 
            margin: 0, 
            lineHeight: "1.4"
          }}>
            No amendment risks detected in current text.<br/>
            Select protocol sections or enable real-time monitoring<br/>
            to analyze infectious disease clinical trial language.
          </p>
        </div>
      </div>
    );
  }

  const totalCritical = groupedFindings.critical.length;
  const totalHigh = groupedFindings.high.length;
  const totalMedium = groupedFindings.medium.length;
  const totalLow = groupedFindings.low.length;

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {/* Header Summary */}
      <div style={{ 
        padding: "16px", 
        borderBottom: "2px solid #2d5aa0",
        background: "linear-gradient(135deg, #fef2f2, #fee2e2)"
      }}>
        <h3 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "14px", 
          fontWeight: "700",
          color: "#b91c1c",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>🦠</span>
          ID Protocol Amendment Risks
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "4px",
          fontSize: "10px",
          fontWeight: "600"
        }}>
          {totalCritical > 0 && (
            <div style={{ textAlign: "center", color: "#dc3545" }}>
              🚨 {totalCritical} Critical
            </div>
          )}
          {totalHigh > 0 && (
            <div style={{ textAlign: "center", color: "#fd7e14" }}>
              ⚠️ {totalHigh} High
            </div>
          )}
          {totalMedium > 0 && (
            <div style={{ textAlign: "center", color: "#ffc107" }}>
              ⚡ {totalMedium} Medium
            </div>
          )}
          {totalLow > 0 && (
            <div style={{ textAlign: "center", color: "#28a745" }}>
              ✅ {totalLow} Low
            </div>
          )}
        </div>
        
        <p style={{ 
          margin: "8px 0 0 0", 
          fontSize: "11px", 
          color: "#7c2d12",
          fontStyle: "italic"
        }}>
          {findings.length} potential amendment trigger{findings.length > 1 ? "s" : ""} identified in protocol
        </p>
      </div>

      {/* Grouped Risk Findings */}
      <div style={{ padding: "12px" }}>
        {renderRiskGroup("Critical", groupedFindings.critical, "#dc3545", "🚨")}
        {renderRiskGroup("High", groupedFindings.high, "#fd7e14", "⚠️")}
        {renderRiskGroup("Medium", groupedFindings.medium, "#ffc107", "⚡")}
        {renderRiskGroup("Low", groupedFindings.low, "#28a745", "✅")}
      </div>

      {/* Footer Summary */}
      <div style={{ 
        padding: "16px", 
        borderTop: "2px solid #e9ecef",
        background: "linear-gradient(135deg, #e8f4fd, #dbeafe)",
        textAlign: "center"
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: "11px", 
          color: "#1e3a8a",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        }}>
          <span>💡</span>
          Addressing these risks prevents costly ID protocol amendments
        </p>
      </div>
    </div>
  );
};