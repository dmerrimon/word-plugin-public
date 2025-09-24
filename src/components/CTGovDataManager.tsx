/**
 * ClinicalTrials.gov Data Manager Component
 * Provides UI for managing CT.gov data collection and system initialization
 */

import * as React from 'react';
import { EnhancedProtocolIntelligence } from '../services/enhancedProtocolIntelligence';
import { ClinicalTrialsDataCollector } from '../services/clinicalTrialsDataCollector';

interface CTGovDataManagerProps {
  onInitializationComplete?: () => void;
}

interface CollectionProgress {
  current: number;
  total: number;
  status: string;
  percentage: number;
  isActive: boolean;
}

export const CTGovDataManager: React.FC<CTGovDataManagerProps> = ({
  onInitializationComplete
}) => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isCollecting, setIsCollecting] = React.useState(false);
  const [progress, setProgress] = React.useState<CollectionProgress>({
    current: 0,
    total: 0,
    status: 'Ready to start',
    percentage: 0,
    isActive: false
  });
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<any>(null);
  
  const intelligence = React.useRef(new EnhancedProtocolIntelligence());
  
  React.useEffect(() => {
    checkInitializationStatus();
  }, []);
  
  const checkInitializationStatus = async () => {
    try {
      const initialized = intelligence.current.isInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        const knowledgeStats = intelligence.current.getKnowledgeBaseStats();
        setStats(knowledgeStats);
      }
    } catch (error) {
      console.error('Error checking initialization status:', error);
    }
  };
  
  const startDataCollection = async () => {
    setIsCollecting(true);
    setError(null);
    setProgress({
      current: 0,
      total: 0,
      status: 'Initializing data collection...',
      percentage: 0,
      isActive: true
    });
    
    try {
      await intelligence.current.initializeWithCTGovData((progressUpdate) => {
        const percentage = progressUpdate.total > 0 
          ? Math.round((progressUpdate.current / progressUpdate.total) * 100)
          : 0;
        
        setProgress({
          current: progressUpdate.current,
          total: progressUpdate.total,
          status: progressUpdate.status,
          percentage,
          isActive: true
        });
      });
      
      // Update status
      setIsInitialized(true);
      setIsCollecting(false);
      
      // Get final stats
      const finalStats = intelligence.current.getKnowledgeBaseStats();
      setStats(finalStats);
      
      setProgress({
        current: progress.total,
        total: progress.total,
        status: 'Data collection completed successfully!',
        percentage: 100,
        isActive: false
      });
      
      onInitializationComplete?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsCollecting(false);
      setProgress(prev => ({
        ...prev,
        status: 'Error occurred during data collection',
        isActive: false
      }));
    }
  };
  
  const loadExistingData = () => {
    try {
      const existingData = ClinicalTrialsDataCollector.loadTrialsData();
      if (existingData && existingData.length > 0) {
        intelligence.current = new EnhancedProtocolIntelligence();
        setIsInitialized(true);
        
        const knowledgeStats = intelligence.current.getKnowledgeBaseStats();
        setStats(knowledgeStats);
        
        onInitializationComplete?.();
      } else {
        setError('No existing data found in storage');
      }
    } catch (err) {
      setError('Failed to load existing data');
    }
  };
  
  const clearData = () => {
    try {
      localStorage.removeItem('clinicalTrialsData');
      setIsInitialized(false);
      setStats(null);
      setProgress({
        current: 0,
        total: 0,
        status: 'Data cleared - ready to collect new data',
        percentage: 0,
        isActive: false
      });
    } catch (err) {
      setError('Failed to clear data');
    }
  };
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🏥 Enhanced Data Management
      </h3>
      
      {/* Status Section */}
      <div style={{
        padding: '12px',
        backgroundColor: isInitialized ? '#ecfdf5' : '#fef3c7',
        border: `1px solid ${isInitialized ? '#d1fae5' : '#fcd34d'}`,
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isInitialized ? '#065f46' : '#92400e',
          marginBottom: '4px'
        }}>
          Status: {isInitialized ? '✅ Initialized' : '⚠️ Not Initialized'}
        </div>
        
        {stats && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Knowledge Base: {stats.totalTrials?.toLocaleString()} trials loaded • Source: {stats.dataSource}
          </div>
        )}
        
        {!isInitialized && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            System requires comprehensive trial data to provide enhanced protocol intelligence.
          </div>
        )}
      </div>
      
      {/* Progress Section */}
      {(isCollecting || progress.isActive) && (
        <div style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #dbeafe',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#1e40af',
            marginBottom: '8px'
          }}>
            Collection Progress: {progress.percentage}%
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {progress.status}
          </div>
          
          {progress.total > 0 && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
              {progress.current.toLocaleString()} of {progress.total.toLocaleString()} trials processed
            </div>
          )}
        </div>
      )}
      
      {/* Error Section */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '4px'
          }}>
            Error:
          </div>
          <div style={{ fontSize: '11px', color: '#7f1d1d' }}>
            {error}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {!isInitialized && (
          <>
            <button
              onClick={startDataCollection}
              disabled={isCollecting}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: isCollecting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCollecting ? 'not-allowed' : 'pointer'
              }}
            >
              {isCollecting ? '🔄 Collecting...' : '🚀 Start Full Collection'}
            </button>
            
            <button
              onClick={loadExistingData}
              disabled={isCollecting}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCollecting ? 'not-allowed' : 'pointer'
              }}
            >
              📂 Load Existing Data
            </button>
          </>
        )}
        
        {isInitialized && (
          <>
            <button
              onClick={() => {
                const stats = intelligence.current.getKnowledgeBaseStats();
                alert(`Knowledge Base Status:\n\nTotal Trials: ${stats?.totalTrials?.toLocaleString()}\nData Source: ${stats?.dataSource}\nStatus: ${stats?.status}`);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📊 View Stats
            </button>
            
            <button
              onClick={clearData}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear Data
            </button>
          </>
        )}
      </div>
      
      {/* Info Section */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '6px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '4px'
        }}>
          ℹ️ About Data Collection:
        </div>
        <ul style={{
          fontSize: '11px',
          color: '#0c4a6e',
          margin: '0',
          paddingLeft: '16px',
          lineHeight: '1.4'
        }}>
          <li>Collects comprehensive trial database from regulatory sources</li>
          <li>Extracts structured data: eligibility, interventions, outcomes, sites</li>
          <li>Builds comprehensive knowledge base for enhanced protocol intelligence</li>
          <li>Data is stored locally and can be reused across sessions</li>
          <li>Collection takes 1-3 hours depending on network speed</li>
        </ul>
      </div>
    </div>
  );
};