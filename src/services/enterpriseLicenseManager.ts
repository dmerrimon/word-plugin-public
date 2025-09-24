import { EnhancedProtocolIntelligence } from './enhancedProtocolIntelligence';

export interface LicenseValidationResponse {
  allowed: boolean;
  error?: string;
  error_code?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string;
  };
  organization?: {
    id: string;
    name: string;
    subscription_type: string;
  };
  features?: Record<string, boolean>;
  limits?: {
    queries_remaining: number;
    protocols_remaining: number;
  };
  action_required?: string;
}

export interface UserSession {
  token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    subscription_type: string;
  };
}

export class EnterpriseLicenseManager {
  private static instance: EnterpriseLicenseManager;
  private baseUrl: string;
  private currentSession: UserSession | null = null;
  private licenseCache: Map<string, { response: LicenseValidationResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.protocol-intelligence.com' 
      : 'http://localhost:3001';
  }

  static getInstance(): EnterpriseLicenseManager {
    if (!EnterpriseLicenseManager.instance) {
      EnterpriseLicenseManager.instance = new EnterpriseLicenseManager();
    }
    return EnterpriseLicenseManager.instance;
  }

  /**
   * Initialize license manager and attempt to restore existing session
   */
  async initialize(): Promise<boolean> {
    try {
      // Try to restore session from storage
      const savedSession = this.getStoredSession();
      if (savedSession && this.isSessionValid(savedSession)) {
        this.currentSession = savedSession;
        return true;
      }

      // Try to authenticate using Office context
      const officeUser = await this.getOfficeUserInfo();
      if (officeUser) {
        return await this.authenticateWithEmail(officeUser.email);
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      return false;
    }
  }

  /**
   * Get current Office user information
   */
  private async getOfficeUserInfo(): Promise<{ email: string; name: string } | null> {
    return new Promise((resolve) => {
      Office.context.mailbox?.getUserIdentityTokenAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          try {
            // Decode JWT token to get user info
            const tokenParts = result.value.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            resolve({
              email: payload.upn || payload.email,
              name: payload.name || 'User'
            });
          } catch (error) {
            console.error('Failed to decode user token:', error);
            resolve(null);
          }
        } else {
          // Fallback for Word desktop
          try {
            const userEmail = Office.context.mailbox?.userProfile?.emailAddress;
            const userName = Office.context.mailbox?.userProfile?.displayName;
            
            if (userEmail) {
              resolve({ email: userEmail, name: userName || 'User' });
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Failed to get Office user info:', error);
            resolve(null);
          }
        }
      });
    });
  }

  /**
   * Authenticate user with email address
   */
  private async authenticateWithEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/license/check-user/${encodeURIComponent(email)}`);
      const userCheck = await response.json();

      if (userCheck.exists && userCheck.active) {
        // User exists and is active, try to create session
        // This would typically involve SSO flow or existing session restoration
        
        // For now, create a basic session (in production, this would come from SSO)
        const session: UserSession = {
          token: 'temp-session-token', // Would come from actual authentication
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'temp-id',
            email: email,
            name: 'User',
            role: userCheck.role
          },
          organization: {
            id: 'temp-org-id',
            name: userCheck.organization,
            subscription_type: userCheck.subscription_type
          }
        };

        this.currentSession = session;
        this.storeSession(session);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Validate license for specific feature usage
   */
  async validateLicense(feature?: string, metadata?: any): Promise<LicenseValidationResponse> {
    try {
      // Check cache first
      const cacheKey = `${this.currentSession?.user.email || 'unknown'}:${feature || 'general'}`;
      const cached = this.licenseCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.response;
      }

      // If no session, try to initialize
      if (!this.currentSession) {
        const initialized = await this.initialize();
        if (!initialized) {
          return this.createErrorResponse('NO_SESSION', 'Please sign in to use Protocol Intelligence');
        }
      }

      // Make API call to validate license
      const response = await fetch(`${this.baseUrl}/api/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession!.token}`
        },
        body: JSON.stringify({
          email: this.currentSession!.user.email,
          feature: feature,
          metadata: metadata
        })
      });

      const licenseResponse: LicenseValidationResponse = await response.json();

      // Cache the response
      this.licenseCache.set(cacheKey, {
        response: licenseResponse,
        timestamp: Date.now()
      });

      // Handle token refresh if needed
      if (licenseResponse.error_code === 'TOKEN_EXPIRED') {
        await this.refreshSession();
        // Retry once with new token
        return await this.validateLicense(feature, metadata);
      }

      return licenseResponse;

    } catch (error) {
      console.error('License validation failed:', error);
      return this.createErrorResponse('VALIDATION_FAILED', 'Unable to validate license. Please check your connection.');
    }
  }

  /**
   * Check if user has access to Protocol Intelligence
   */
  async hasAccess(): Promise<boolean> {
    const validation = await this.validateLicense();
    return validation.allowed;
  }

  /**
   * Check if user can analyze protocols
   */
  async canAnalyzeProtocol(): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    const validation = await this.validateLicense('protocol_analysis');
    
    return {
      allowed: validation.allowed,
      reason: validation.error,
      remaining: validation.limits?.protocols_remaining
    };
  }

  /**
   * Check if user can query database
   */
  async canQueryDatabase(): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    const validation = await this.validateLicense('database_query');
    
    return {
      allowed: validation.allowed,
      reason: validation.error,
      remaining: validation.limits?.queries_remaining
    };
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    return this.currentSession?.user || null;
  }

  /**
   * Get current organization information
   */
  getCurrentOrganization() {
    return this.currentSession?.organization || null;
  }

  /**
   * Track usage for analytics
   */
  async trackUsage(eventType: string, metadata?: any): Promise<void> {
    try {
      if (!this.currentSession) return;

      await fetch(`${this.baseUrl}/api/license/track-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSession.token}`
        },
        body: JSON.stringify({
          event_type: eventType,
          metadata: metadata
        })
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - usage tracking shouldn't break functionality
    }
  }

  /**
   * Get user's usage statistics
   */
  async getUsageStats(): Promise<any> {
    try {
      if (!this.currentSession) return null;

      const response = await fetch(`${this.baseUrl}/api/license/usage-stats`, {
        headers: {
          'Authorization': `Bearer ${this.currentSession.token}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }

  /**
   * Handle license upgrade flow
   */
  handleUpgradeRequired(errorCode: string): void {
    const upgradeMessages = {
      'FEATURE_NOT_AVAILABLE': 'This feature requires a higher subscription plan. Contact your administrator to upgrade.',
      'USAGE_LIMIT_EXCEEDED': 'You have reached your monthly usage limit. Upgrade your plan for unlimited access.',
      'CONTRACT_EXPIRED': 'Your organization\'s contract has expired. Please contact billing to renew.'
    };

    const message = upgradeMessages[errorCode as keyof typeof upgradeMessages] || 'Upgrade required to access this feature.';
    
    // Show upgrade message in UI
    this.showUpgradeDialog(message, errorCode);
  }

  /**
   * Show upgrade dialog to user
   */
  private showUpgradeDialog(message: string, errorCode: string): void {
    // This would integrate with your UI framework
    console.warn('License Upgrade Required:', message);
    
    // You could show a modal, notification, or redirect to upgrade page
    // For now, just log the message
  }

  /**
   * Refresh user session
   */
  private async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) return false;

      const response = await fetch(`${this.baseUrl}/api/license/refresh-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentSession.token}`
        }
      });

      if (response.ok) {
        const { token, expires_at } = await response.json();
        this.currentSession.token = token;
        this.currentSession.expires_at = expires_at;
        this.storeSession(this.currentSession);
        
        // Clear cache to force re-validation with new token
        this.licenseCache.clear();
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  /**
   * Store session in local storage
   */
  private storeSession(session: UserSession): void {
    try {
      localStorage.setItem('protocol_intelligence_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Get stored session from local storage
   */
  private getStoredSession(): UserSession | null {
    try {
      const stored = localStorage.getItem('protocol_intelligence_session');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }

  /**
   * Check if session is still valid
   */
  private isSessionValid(session: UserSession): boolean {
    return new Date(session.expires_at) > new Date();
  }

  /**
   * Create error response
   */
  private createErrorResponse(errorCode: string, message: string): LicenseValidationResponse {
    return {
      allowed: false,
      error: message,
      error_code: errorCode
    };
  }

  /**
   * Clear current session and cache
   */
  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        await fetch(`${this.baseUrl}/api/license/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentSession.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.currentSession = null;
      this.licenseCache.clear();
      localStorage.removeItem('protocol_intelligence_session');
    }
  }

  /**
   * Integration with existing Enhanced Protocol Intelligence
   */
  async initializeProtocolIntelligence(): Promise<EnhancedProtocolIntelligence | null> {
    const hasAccess = await this.hasAccess();
    
    if (!hasAccess) {
      console.warn('Protocol Intelligence access denied');
      return null;
    }

    // Track usage
    await this.trackUsage('protocol_intelligence_initialized');

    // Return initialized service
    return new EnhancedProtocolIntelligence();
  }
}

// Export singleton instance
export const licenseManager = EnterpriseLicenseManager.getInstance();