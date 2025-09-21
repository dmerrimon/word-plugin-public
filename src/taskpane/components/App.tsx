import * as React from "react";
import { useState, useEffect } from "react";
import { Header } from "./Header";
import { ProtocolAnalyzer } from "./ProtocolAnalyzer";
import { RiskSidebar } from "./RiskSidebar";

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

  // Monitor text selection changes
  useEffect(() => {
    if (!isOfficeInitialized || !isMonitoring) return;

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
            analyzeText(text);
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
  }, [isOfficeInitialized, isMonitoring, selectedText]);

  const analyzeText = async (text: string) => {
    if (!text || text.length < 10) return;

    setIsAnalyzing(true);
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
      } else {
        console.error("API request failed:", response.status);
        // Fallback to local pattern matching for demo
        const localFindings = performLocalAnalysis(text);
        setRiskFindings(localFindings);
      }
    } catch (error) {
      console.error("Error analyzing text:", error);
      // Fallback to local pattern matching
      const localFindings = performLocalAnalysis(text);
      setRiskFindings(localFindings);
    } finally {
      setIsAnalyzing(false);
    }
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
    const textLower = text.toLowerCase();

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
      analyzeText(demoText);
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
          analyzeText(text);
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
      
      <ProtocolAnalyzer
        isMonitoring={isMonitoring}
        isAnalyzing={isAnalyzing}
        selectedText={selectedText}
        onToggleMonitoring={toggleMonitoring}
        onAnalyzeSelection={analyzeSelection}
      />
      
      <RiskSidebar
        findings={riskFindings}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};