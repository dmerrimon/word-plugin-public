import * as React from "react";
import { useState, useEffect } from "react";
import { Header } from "./Header";
import { ProtocolAnalyzer } from "./ProtocolAnalyzer";
import { RiskSidebar } from "./RiskSidebar";
import { ProtocolIntelligence } from "./ProtocolIntelligence";

export interface AppProps {
  title: string;
  isOfficeInitialized: boolean;
}

interface RiskFinding {
  phrase: string;
  risk_score: number;
  fix: string;
  reason?: string;
  evidence?: string;
  location?: string;
}

export const App: React.FC<AppProps> = ({ title, isOfficeInitialized }) => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [riskFindings, setRiskFindings] = useState<RiskFinding[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [documentText, setDocumentText] = useState<string>("");
  const [highlightedRanges, setHighlightedRanges] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [categoryStats, setCategoryStats] = useState({ enrollment: 0, lab: 0, visit: 0, dosing: 0, other: 0 });
  const [activeView, setActiveView] = useState<'amendments' | 'intelligence'>('amendments');

  // Real-time document monitoring
  useEffect(() => {
    if (!isOfficeInitialized || !isMonitoring) return;

    // Check if Office APIs are available
    if (typeof Office === 'undefined' || !Office.context?.document) {
      console.log("Office APIs not available - running in browser mode");
      // Simulate real-time analysis in browser mode
      const demoText = "Patients must have documented culture proven infection with clinically significant symptoms requiring appropriate antimicrobial therapy within 24 hours. Enrollment requires consecutive days of fever and adequate renal function within normal range as deemed appropriate by the investigator.";
      setDocumentText(demoText);
      analyzeText(demoText, true);
      return;
    }

    let analysisTimeout: NodeJS.Timeout;

    const handleDocumentChange = async () => {
      // Debounce analysis to avoid too frequent calls
      clearTimeout(analysisTimeout);
      analysisTimeout = setTimeout(async () => {
        try {
          await Word.run(async (context) => {
            const body = context.document.body;
            body.load("text");
            await context.sync();
            
            const fullText = body.text;
            if (fullText && fullText !== documentText) {
              setDocumentText(fullText);
              analyzeText(fullText, true);
            }
          });
        } catch (error) {
          console.error("Error monitoring document:", error);
        }
      }, 1000); // 1 second debounce
    };

    // Monitor document changes
    const handleSelectionChange = async () => {
      handleDocumentChange();
    };

    // Set up event listeners
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      handleSelectionChange
    );

    // Initial analysis
    handleDocumentChange();

    return () => {
      clearTimeout(analysisTimeout);
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        handleSelectionChange
      );
    };
  }, [isOfficeInitialized, isMonitoring, documentText]);

  // Monitor text selection changes (for manual analysis)
  useEffect(() => {
    if (!isOfficeInitialized) return;

    // Check if Office APIs are available (not available in browser testing)
    if (typeof Office === 'undefined' || !Office.context?.document) {
      console.log("Office APIs not available - running in browser mode");
      return;
    }

    const handleSelectionChange = async () => {
      try {
        await Word.run(async (context) => {
          const selection = context.document.getSelection();
          selection.load("text");
          
          await context.sync();
          
          const text = selection.text?.trim();
          if (text && text.length > 10 && text !== selectedText) {
            setSelectedText(text);
            analyzeText(text, false);
          }
        });
      } catch (error) {
        console.error("Error reading selection:", error);
      }
    };

    // Set up event listener for selection changes
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      handleSelectionChange
    );

    return () => {
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        handleSelectionChange
      );
    };
  }, [isOfficeInitialized, selectedText]);

  const analyzeText = async (text: string, isRealTime = false) => {
    if (!text || text.length < 10) return;

    if (!isRealTime) setIsAnalyzing(true);
    try {
      // Call your existing Render backend API
      const response = await fetch("https://protocol-risk-detection.onrender.com/api/analyze-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer demo-token-12345" // Your existing auth
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform the response to match our interface
        const findings: RiskFinding[] = data.matches?.map((match: any) => ({
          phrase: match.phrase || match.problematic_phrase,
          risk_score: match.risk_score || match.confidence,
          fix: match.fix || match.recommendation,
          reason: match.reason,
          evidence: match.evidence,
          location: match.location
        })) || [];

        setRiskFindings(findings);
        updateStats(findings);
        if (isRealTime) highlightProblematicText(findings);
      } else {
        console.error("API request failed:", response.status);
        // Fallback to local pattern matching for demo
        const localFindings = performLocalAnalysis(text);
        setRiskFindings(localFindings);
        updateStats(localFindings);
        if (isRealTime) highlightProblematicText(localFindings);
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      // Fallback to local pattern matching
      const localFindings = performLocalAnalysis(text);
      setRiskFindings(localFindings);
      updateStats(localFindings);
      if (isRealTime) highlightProblematicText(localFindings);
    } finally {
      if (!isRealTime) setIsAnalyzing(false);
    }
  };

  // Update statistics
  const updateStats = (findings: RiskFinding[]) => {
    const stats = {
      total: findings.length,
      critical: findings.filter(f => f.risk_score >= 85).length,
      high: findings.filter(f => f.risk_score >= 70 && f.risk_score < 85).length,
      medium: findings.filter(f => f.risk_score >= 50 && f.risk_score < 70).length,
      low: findings.filter(f => f.risk_score < 50).length
    };
    setTotalStats(stats);

    // Category breakdown
    const categories = { enrollment: 0, lab: 0, visit: 0, dosing: 0, other: 0 };
    findings.forEach(finding => {
      const phrase = finding.phrase.toLowerCase();
      if (phrase.includes('inclusion') || phrase.includes('exclusion') || phrase.includes('eligibility') || phrase.includes('criteria') || phrase.includes('documented') || phrase.includes('proven')) {
        categories.enrollment++;
      } else if (phrase.includes('lab') || phrase.includes('value') || phrase.includes('range') || phrase.includes('test') || phrase.includes('renal') || phrase.includes('function')) {
        categories.lab++;
      } else if (phrase.includes('visit') || phrase.includes('day') || phrase.includes('week') || phrase.includes('schedule') || phrase.includes('hour') || phrase.includes('consecutive')) {
        categories.visit++;
      } else if (phrase.includes('dose') || phrase.includes('mg') || phrase.includes('treatment') || phrase.includes('drug') || phrase.includes('antimicrobial') || phrase.includes('therapy')) {
        categories.dosing++;
      } else {
        categories.other++;
      }
    });
    setCategoryStats(categories);
  };

  // Highlight problematic text in document
  const highlightProblematicText = async (findings: RiskFinding[]) => {
    if (typeof Word === 'undefined') return;

    try {
      await Word.run(async (context) => {
        // Clear previous highlights
        highlightedRanges.forEach(range => {
          try {
            if (range && range.isValid) {
              range.font.highlightColor = null;
              range.font.bold = false;
              range.font.italic = false;
            }
          } catch (error) {
            // Range might be invalid, ignore
          }
        });

        const newRanges: any[] = [];
        
        // Highlight each problematic phrase
        for (const finding of findings) {
          const searchResults = context.document.body.search(finding.phrase, {
            matchCase: false,
            matchWholeWord: false
          });
          
          searchResults.load("font");
          await context.sync();
          
          searchResults.items.forEach(result => {
            // Color-code highlighting based on risk level
            if (finding.risk_score >= 85) {
              result.font.highlightColor = "#ffcccc"; // Light red for critical
              result.font.bold = true;
            } else if (finding.risk_score >= 70) {
              result.font.highlightColor = "#ffe6cc"; // Light orange for high
              result.font.bold = true;
            } else if (finding.risk_score >= 50) {
              result.font.highlightColor = "#ffffcc"; // Light yellow for medium
              result.font.italic = true;
            } else {
              result.font.highlightColor = "#ccffcc"; // Light green for low
            }
            newRanges.push(result);
          });
        }
        
        setHighlightedRanges(newRanges);
        await context.sync();
      });
    } catch (error) {
      console.error("Error highlighting text:", error);
    }
  };

  // Export risk report
  const exportRiskReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      documentAnalysis: {
        totalRisks: totalStats.total,
        riskBreakdown: {
          critical: totalStats.critical,
          high: totalStats.high,
          medium: totalStats.medium,
          low: totalStats.low
        },
        categoryBreakdown: categoryStats
      },
      findings: riskFindings.map(finding => ({
        phrase: finding.phrase,
        riskScore: finding.risk_score,
        riskLevel: finding.risk_score >= 85 ? 'CRITICAL' : finding.risk_score >= 70 ? 'HIGH' : finding.risk_score >= 50 ? 'MEDIUM' : 'LOW',
        recommendedFix: finding.fix,
        clinicalRationale: finding.reason,
        evidence: finding.evidence
      }))
    };

    const reportText = `
ID PROTOCOL AMENDMENT RISK REPORT
${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
${'-'.repeat(20)}
Total Risks Identified: ${totalStats.total}
  • Critical: ${totalStats.critical}
  • High: ${totalStats.high} 
  • Medium: ${totalStats.medium}
  • Low: ${totalStats.low}

CATEGORY BREAKDOWN
${'-'.repeat(20)}
  • Enrollment Criteria: ${categoryStats.enrollment} issues
  • Laboratory Requirements: ${categoryStats.lab} issues
  • Visit Schedule: ${categoryStats.visit} issues
  • Dosing/Treatment: ${categoryStats.dosing} issues
  • Other: ${categoryStats.other} issues

DETAILED FINDINGS
${'-'.repeat(20)}
${riskFindings.map((finding, index) => `
${index + 1}. RISK LEVEL: ${finding.risk_score >= 85 ? 'CRITICAL' : finding.risk_score >= 70 ? 'HIGH' : finding.risk_score >= 50 ? 'MEDIUM' : 'LOW'} (${finding.risk_score}%)
   Problematic Text: "${finding.phrase}"
   Recommended Fix: "${finding.fix}"
   Clinical Rationale: ${finding.reason || 'N/A'}
`).join('')}

RECOMMENDATIONS
${'-'.repeat(20)}
• Address CRITICAL and HIGH risk items immediately to prevent amendments
• Review MEDIUM risk items during protocol finalization
• Consider implementing suggested language changes
• Validate with clinical and regulatory teams

Generated by Ilana Protocol Assistant
https://ilana-addin.netlify.app
`;

    // Create and download the report
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ID_Protocol_Risk_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Local fallback analysis using ID-specific patterns from your backend
  const performLocalAnalysis = (text: string): RiskFinding[] => {
    const patterns = [
      // Critical Risk Patterns (85%+)
      {
        pattern: /\d+\s+consecutive\s+days/gi,
        phrase: "consecutive days",
        risk_score: 90,
        fix: "within the past X days",
        reason: "Consecutive day requirements cause major enrollment delays in ID trials"
      },
      {
        pattern: /clinically\s+significant/gi,
        phrase: "clinically significant",
        risk_score: 88,
        fix: "requiring antimicrobial therapy",
        reason: "Subjective criteria lead to inconsistent enrollment decisions"
      },
      {
        pattern: /as\s+deemed\s+appropriate/gi,
        phrase: "as deemed appropriate",
        risk_score: 87,
        fix: "according to institutional guidelines",
        reason: "Vague language creates variability in ID treatment decisions"
      },
      {
        pattern: /within\s+24\s+hours/gi,
        phrase: "within 24 hours",
        risk_score: 85,
        fix: "within 48-72 hours",
        reason: "24-hour windows are especially challenging for acute ID patients"
      },
      
      // High Risk Patterns (70-84%)
      {
        pattern: /within\s+normal\s+range/gi,
        phrase: "within normal range",
        risk_score: 82,
        fix: "specific laboratory values (e.g., ANC ≥1000/μL)",
        reason: "Normal ranges vary significantly between laboratories"
      },
      {
        pattern: /must\s+have\s+documented/gi,
        phrase: "must have documented",
        risk_score: 78,
        fix: "should have available medical records of",
        reason: "Documentation requirements often unavailable for acute ID cases"
      },
      {
        pattern: /culture\s+proven/gi,
        phrase: "culture proven",
        risk_score: 76,
        fix: "microbiologically confirmed or clinically suspected",
        reason: "Culture requirements exclude many valid ID cases"
      },
      {
        pattern: /adequate\s+renal\s+function/gi,
        phrase: "adequate renal function",
        risk_score: 74,
        fix: "creatinine clearance ≥30 mL/min",
        reason: "Vague renal function criteria cause enrollment confusion"
      },
      
      // Medium Risk Patterns (50-69%)
      {
        pattern: /appropriate\s+antimicrobial/gi,
        phrase: "appropriate antimicrobial",
        risk_score: 65,
        fix: "guideline-recommended antimicrobial therapy",
        reason: "Ambiguous appropriateness criteria vary by site"
      },
      {
        pattern: /life\s+expectancy/gi,
        phrase: "life expectancy",
        risk_score: 62,
        fix: "expected survival ≥72 hours",
        reason: "Life expectancy assessments are highly subjective"
      },
      {
        pattern: /severe\s+infection/gi,
        phrase: "severe infection",
        risk_score: 58,
        fix: "infection requiring hospitalization",
        reason: "Severity definitions need objective criteria"
      },
      {
        pattern: /resistant\s+organism/gi,
        phrase: "resistant organism",
        risk_score: 55,
        fix: "organism resistant to standard therapy",
        reason: "Resistance definitions should specify mechanisms"
      },
      
      // Low Risk Patterns (<50%)
      {
        pattern: /standard\s+of\s+care/gi,
        phrase: "standard of care",
        risk_score: 45,
        fix: "current institutional treatment protocols",
        reason: "Standard of care varies between institutions"
      }
    ];

    const findings: RiskFinding[] = [];

    patterns.forEach(({ pattern, phrase, risk_score, fix, reason }) => {
      if (pattern.test(text)) {
        findings.push({
          phrase,
          risk_score,
          fix,
          reason,
          evidence: "Based on historical amendment patterns"
        });
      }
    });

    return findings;
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      // Clear previous findings when starting monitoring
      setRiskFindings([]);
      setSelectedText("");
    }
  };

  const analyzeSelection = async () => {
    // Check if Office APIs are available
    if (typeof Office === 'undefined' || typeof Word === 'undefined') {
      // Browser mode - show demo analysis with ID-specific text
      const demoText = "Patients must have documented culture proven infection with clinically significant symptoms requiring appropriate antimicrobial therapy within 24 hours. Enrollment requires consecutive days of fever and adequate renal function within normal range as deemed appropriate by the investigator.";
      setSelectedText(demoText);
      analyzeText(demoText, false);
      return;
    }

    try {
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.load("text");
        
        await context.sync();
        
        const text = selection.text?.trim();
        if (text) {
          setSelectedText(text);
          analyzeText(text, false);
        } else {
          // No selection, show message
          setRiskFindings([{
            phrase: "No text selected",
            risk_score: 0,
            fix: "Please select some text to analyze",
            reason: "Select protocol text to check for amendment risks"
          }]);
        }
      });
    } catch (error) {
      console.error("Error getting selection:", error);
    }
  };

  if (!isOfficeInitialized) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Initializing Ilana Protocol Assistant...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title={title} />
      
      {/* View Toggle */}
      <div style={{
        display: "flex",
        borderBottom: "2px solid #e5e7eb",
        backgroundColor: "#f9fafb"
      }}>
        <button
          onClick={() => setActiveView('amendments')}
          style={{
            flex: 1,
            padding: "12px",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            backgroundColor: activeView === 'amendments' ? "#dc2626" : "transparent",
            color: activeView === 'amendments' ? "white" : "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <span>🚨</span>
          Amendment Risk Analysis
        </button>
        <button
          onClick={() => setActiveView('intelligence')}
          style={{
            flex: 1,
            padding: "12px",
            fontSize: "13px",
            fontWeight: "600",
            border: "none",
            backgroundColor: activeView === 'intelligence' ? "#2563eb" : "transparent",
            color: activeView === 'intelligence' ? "white" : "#6b7280",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <span>🧠</span>
          Protocol Intelligence
        </button>
      </div>

      {activeView === 'amendments' ? (
        <>
          <ProtocolAnalyzer
            isMonitoring={isMonitoring}
            isAnalyzing={isAnalyzing}
            selectedText={selectedText}
            totalStats={totalStats}
            categoryStats={categoryStats}
            onToggleMonitoring={toggleMonitoring}
            onAnalyzeSelection={analyzeSelection}
            onExportReport={exportRiskReport}
          />
          
          <RiskSidebar
            findings={riskFindings}
            isAnalyzing={isAnalyzing}
            onApplyFix={async (finding) => {
              // Apply fix function
              if (typeof Word === 'undefined') {
                alert(`Demo: Would replace "${finding.phrase}" with "${finding.fix}"`);
                return;
              }

              try {
                await Word.run(async (context) => {
                  const searchResults = context.document.body.search(finding.phrase, {
                    matchCase: false,
                    matchWholeWord: false
                  });
                  
                  searchResults.load("text");
                  await context.sync();
                  
                  if (searchResults.items.length > 0) {
                    // Replace the first occurrence
                    searchResults.items[0].insertText(finding.fix, Word.InsertLocation.replace);
                    await context.sync();
                    
                    // Remove this finding from the list
                    const updatedFindings = riskFindings.filter(f => f.phrase !== finding.phrase);
                    setRiskFindings(updatedFindings);
                    updateStats(updatedFindings);
                    
                    console.log(`Successfully replaced "${finding.phrase}" with "${finding.fix}"`);
                  }
                });
              } catch (error) {
                console.error("Error applying fix:", error);
              }
            }}
          />
        </>
      ) : (
        <ProtocolIntelligence
          protocolText={documentText || selectedText}
          isAnalyzing={isAnalyzing}
          onExportReport={() => {
            // Export intelligence report
            const reportText = `
PROTOCOL INTELLIGENCE REPORT
${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
${'-'.repeat(20)}
This report provides comprehensive intelligence analysis of the clinical protocol,
evaluating complexity, enrollment feasibility, and patient burden across all
therapeutic areas using universal metrics.

ANALYSIS METHODOLOGY
${'-'.repeat(20)}
• Complexity Scorer: Evaluates protocol design complexity (0-100 scale)
• Enrollment Predictor: Estimates enrollment timeline and challenges
• Visit Burden Calculator: Analyzes patient and site operational burden
• Benchmarking: Compares against industry standards

For detailed analysis, please review each section within the application.

Generated by Ilana Protocol Assistant - Universal Intelligence
https://ilana-addin.netlify.app
`;

            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Protocol_Intelligence_Report_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
};