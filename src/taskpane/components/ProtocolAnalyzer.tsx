import * as React from "react";

export interface ProtocolAnalyzerProps {
  isMonitoring: boolean;
  isAnalyzing: boolean;
  selectedText: string;
  onToggleMonitoring: () => void;
  onAnalyzeSelection: () => void;
}

export const ProtocolAnalyzer: React.FC<ProtocolAnalyzerProps> = ({
  isMonitoring,
  isAnalyzing,
  selectedText,
  onToggleMonitoring,
  onAnalyzeSelection
}) => {
  return (
    <div style={{ 
      padding: "16px", 
      borderBottom: "1px solid #e1e1e1",
      background: "linear-gradient(to bottom, #fafbfc, #f5f6f7)"
    }}>
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
        
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
            {isMonitoring ? "Real-time Monitoring ON" : "Enable Real-time Monitor"}
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
            {isAnalyzing ? "Analyzing Protocol..." : "Analyze Selection"}
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
            Continuously scanning for high-risk amendments in infectious disease protocols
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
    </div>
  );
};