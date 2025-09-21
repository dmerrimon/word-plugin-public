import * as React from "react";

export interface ProtocolAnalyzerProps {
  isMonitoring: boolean;
  isAnalyzing: boolean;
  selectedText: string;
  totalStats: { total: number; critical: number; high: number; medium: number; low: number };
  categoryStats: { enrollment: number; lab: number; visit: number; dosing: number; other: number };
  onToggleMonitoring: () => void;
  onAnalyzeSelection: () => void;
  onExportReport: () => void;
}

export const ProtocolAnalyzer: React.FC<ProtocolAnalyzerProps> = ({
  isMonitoring,
  isAnalyzing,
  selectedText,
  totalStats,
  categoryStats,
  onToggleMonitoring,
  onAnalyzeSelection,
  onExportReport
}) => {
  // Feedback modal state
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState("");
  const [feedbackType, setFeedbackType] = React.useState("suggestion");

  const submitFeedback = () => {
    // In a real implementation, this would send to your backend
    console.log("Feedback submitted:", { type: feedbackType, text: feedbackText });
    alert("Thank you for your feedback! This helps us improve the ID Protocol Assistant.");
    setShowFeedback(false);
    setFeedbackText("");
  };

  return (
    <div style={{ 
      padding: "16px", 
      borderBottom: "1px solid #e1e1e1",
      background: "linear-gradient(to bottom, #fafbfc, #f5f6f7)"
    }}>
      {/* Quick Stats Dashboard */}
      {totalStats.total > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ 
            margin: "0 0 10px 0", 
            fontSize: "13px", 
            fontWeight: "700",
            color: "#2d5aa0",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span>📊</span>
            Risk Summary Dashboard
          </h3>
          
          <div style={{
            padding: "12px",
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "2px solid #dc3545",
            borderRadius: "8px",
            marginBottom: "12px"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <div style={{ 
                fontSize: "14px", 
                fontWeight: "700", 
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>🎯</span>
                Total Risks Found: {totalStats.total}
              </div>
              <div style={{ fontSize: "12px", color: "#7c2d12" }}>
                ID Protocol Analysis
              </div>
            </div>
            
            {/* Risk Breakdown */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              {totalStats.critical > 0 && (
                <div style={{
                  padding: "6px 8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  borderRadius: "4px",
                  textAlign: "center"
                }}>
                  🚨 Critical: {totalStats.critical}
                </div>
              )}
              {totalStats.high > 0 && (
                <div style={{
                  padding: "6px 8px",
                  backgroundColor: "#fd7e14",
                  color: "white",
                  borderRadius: "4px",
                  textAlign: "center"
                }}>
                  ⚠️ High: {totalStats.high}
                </div>
              )}
              {totalStats.medium > 0 && (
                <div style={{
                  padding: "6px 8px",
                  backgroundColor: "#ffc107",
                  color: "#212529",
                  borderRadius: "4px",
                  textAlign: "center"
                }}>
                  ⚡ Medium: {totalStats.medium}
                </div>
              )}
              {totalStats.low > 0 && (
                <div style={{
                  padding: "6px 8px",
                  backgroundColor: "#28a745",
                  color: "white",
                  borderRadius: "4px",
                  textAlign: "center"
                }}>
                  ✅ Low: {totalStats.low}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={{
            padding: "12px",
            background: "linear-gradient(135deg, #e8f4fd, #dbeafe)",
            border: "2px solid #2d5aa0",
            borderRadius: "8px"
          }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "700", 
              color: "#1e3a8a",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>🏥</span>
              Category Breakdown:
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "6px",
              fontSize: "10px",
              fontWeight: "600"
            }}>
              {categoryStats.enrollment > 0 && (
                <div style={{ color: "#856404" }}>📋 Enrollment: {categoryStats.enrollment}</div>
              )}
              {categoryStats.lab > 0 && (
                <div style={{ color: "#0c5460" }}>🔬 Lab Criteria: {categoryStats.lab}</div>
              )}
              {categoryStats.visit > 0 && (
                <div style={{ color: "#155724" }}>📅 Visit Schedule: {categoryStats.visit}</div>
              )}
              {categoryStats.dosing > 0 && (
                <div style={{ color: "#721c24" }}>💊 Dosing: {categoryStats.dosing}</div>
              )}
              {categoryStats.other > 0 && (
                <div style={{ color: "#495057" }}>📝 Other: {categoryStats.other}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ID-Specific Categories */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ 
          margin: "0 0 10px 0", 
          fontSize: "13px", 
          fontWeight: "700",
          color: "#2d5aa0",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span>🧬</span>
          ID Protocol Risk Categories
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "6px",
          fontSize: "10px"
        }}>
          <div style={{
            padding: "6px 8px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "4px",
            textAlign: "center"
          }}>
            <div style={{ fontWeight: "600", color: "#856404" }}>📋 Enrollment</div>
            <div style={{ color: "#6c5ce7", fontSize: "9px" }}>Inclusion/Exclusion</div>
          </div>
          
          <div style={{
            padding: "6px 8px",
            backgroundColor: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: "4px",
            textAlign: "center"
          }}>
            <div style={{ fontWeight: "600", color: "#0c5460" }}>🔬 Lab Criteria</div>
            <div style={{ color: "#6c5ce7", fontSize: "9px" }}>Values & Ranges</div>
          </div>
          
          <div style={{
            padding: "6px 8px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            textAlign: "center"
          }}>
            <div style={{ fontWeight: "600", color: "#155724" }}>📅 Visit Schedule</div>
            <div style={{ color: "#6c5ce7", fontSize: "9px" }}>Timing & Windows</div>
          </div>
          
          <div style={{
            padding: "6px 8px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            textAlign: "center"
          }}>
            <div style={{ fontWeight: "600", color: "#721c24" }}>💊 Dosing</div>
            <div style={{ color: "#6c5ce7", fontSize: "9px" }}>Regimens & Safety</div>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ 
          margin: "0 0 10px 0", 
          fontSize: "13px", 
          fontWeight: "700",
          color: "#2d5aa0",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span>🩺</span>
          Clinical Analysis Mode
        </h3>
        
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <button
            onClick={onToggleMonitoring}
            style={{
              padding: "10px 14px",
              fontSize: "12px",
              border: "2px solid #2d5aa0",
              borderRadius: "6px",
              backgroundColor: isMonitoring ? "#2d5aa0" : "white",
              color: isMonitoring ? "white" : "#2d5aa0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "600",
              boxShadow: isMonitoring ? "0 2px 4px rgba(45,90,160,0.3)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <span>{isMonitoring ? "🟢" : "⚪"}</span>
            {isMonitoring ? "Real-time ON" : "Enable Monitor"}
          </button>
          
          <button
            onClick={onAnalyzeSelection}
            disabled={isAnalyzing}
            style={{
              padding: "10px 14px",
              fontSize: "12px",
              border: "2px solid #1a4480",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#1a4480",
              cursor: isAnalyzing ? "not-allowed" : "pointer",
              opacity: isAnalyzing ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
          >
            <span>{isAnalyzing ? "⏳" : "🔍"}</span>
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Export and Feedback Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {totalStats.total > 0 && (
            <button
              onClick={onExportReport}
              style={{
                padding: "8px 12px",
                fontSize: "11px",
                border: "2px solid #28a745",
                borderRadius: "6px",
                backgroundColor: "white",
                color: "#28a745",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "600",
                transition: "all 0.2s ease"
              }}
            >
              <span>📄</span>
              Export Report
            </button>
          )}

          <button
            onClick={() => setShowFeedback(true)}
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              border: "2px solid #6f42c1",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#6f42c1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
          >
            <span>💬</span>
            Beta Feedback
          </button>
        </div>
      </div>

      {isMonitoring && (
        <div style={{
          padding: "12px",
          background: "linear-gradient(135deg, #e8f4fd, #d1ecf1)",
          border: "2px solid #2d5aa0",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#1a4480"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px" }}>🤖</span>
            <strong>ID Protocol Monitor Active</strong>
          </div>
          <div style={{ fontSize: "11px", color: "#2d5aa0" }}>
            Real-time scanning for amendment risks • Text highlighting enabled • Confidence scoring active
          </div>
        </div>
      )}

      {selectedText && (
        <div style={{ marginTop: "12px" }}>
          <h4 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "12px", 
            fontWeight: "600",
            color: "#2d5aa0",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span>📝</span>
            Protocol Text Under Analysis:
          </h4>
          <div style={{
            padding: "10px",
            backgroundColor: "white",
            border: "2px solid #e1e5e9",
            borderRadius: "6px",
            fontSize: "11px",
            maxHeight: "80px",
            overflow: "auto",
            fontStyle: "italic",
            color: "#495057",
            lineHeight: "1.4"
          }}>
            "{selectedText.substring(0, 250)}{selectedText.length > 250 ? "..." : ""}"
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            width: "300px",
            maxHeight: "400px",
            overflow: "auto"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700", color: "#2d5aa0" }}>
              🚀 Beta Feedback - ID Protocol Assistant
            </h3>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                Feedback Type:
              </label>
              <select 
                value={feedbackType} 
                onChange={(e) => setFeedbackType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              >
                <option value="suggestion">💡 Suggestion</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">✨ Feature Request</option>
                <option value="general">💬 General Feedback</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" }}>
                Your Feedback:
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Help us improve the ID Protocol Assistant..."
                style={{
                  width: "100%",
                  height: "80px",
                  padding: "8px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowFeedback(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={!feedbackText.trim()}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#2d5aa0",
                  color: "white",
                  cursor: feedbackText.trim() ? "pointer" : "not-allowed",
                  opacity: feedbackText.trim() ? 1 : 0.6
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};