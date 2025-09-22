import * as React from "react";

export interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div style={{
      backgroundColor: "#000000",
      color: "#ffffff",
      padding: "20px 16px",
      borderBottom: "1px solid #e5e5e5",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <span style={{ 
          fontSize: "18px", 
          marginRight: "10px"
        }}>🧠</span>
        <h1 style={{ 
          margin: 0, 
          fontSize: "18px", 
          fontWeight: "600",
          letterSpacing: "-0.025em"
        }}>
          {title}
        </h1>
      </div>
      
      <p style={{ 
        margin: 0,
        fontSize: "13px", 
        color: "#888888",
        fontWeight: "400",
        letterSpacing: "-0.01em"
      }}>
        Real-time protocol intelligence powered by 2,439 clinical trials
      </p>
    </div>
  );
};