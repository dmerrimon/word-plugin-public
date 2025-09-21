import * as React from "react";

export interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div style={{
      background: "linear-gradient(135deg, #2d5aa0 0%, #1a4480 100%)",
      color: "white",
      padding: "16px",
      borderBottom: "2px solid #1a4480",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <span style={{ 
          fontSize: "20px", 
          marginRight: "8px",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
        }}>🦠</span>
        <h2 style={{ 
          margin: 0, 
          fontSize: "16px", 
          fontWeight: "700",
          letterSpacing: "0.5px"
        }}>
          {title}
        </h2>
      </div>
      
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "4px"
      }}>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <span>🩺</span>
          ID Protocol Mode
        </div>
        <div style={{
          fontSize: "11px",
          opacity: 0.9,
          fontWeight: "500"
        }}>
          Infectious Disease Clinical Trials
        </div>
      </div>
      
      <p style={{ 
        margin: 0,
        fontSize: "11px", 
        opacity: 0.85,
        fontStyle: "italic"
      }}>
        AI-powered amendment risk detection for ID protocols
      </p>
    </div>
  );
};