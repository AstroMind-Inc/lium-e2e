/**
 * Shared TypeScript types for the Lium E2E Testing Framework
 */

export interface EnvironmentConfig {
  name: string;
  baseUrls: {
    web: string;
    api: string;
    services: Record<string, string>;
  };
  auth0: {
    domain: string;
    clientId: string;
    audience: string;
  };
  timeouts: {
    api: number;
    pageLoad: number;
  };
}

export interface Credentials {
  regular: {
    username: string;
    password: string;
    auth0ClientId?: string;
  };
  elevated?: {
    username: string;
    password: string;
  };
  lastUpdated: string;
}

export interface TestResult {
  timestamp: string;
  pillar: 'synthetic' | 'integration' | 'performance';
  environment: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  user: string;
  error?: string;
  screenshot?: string;
  trace?: string;
  metadata?: Record<string, any>;
}

export interface SlackConfig {
  webhookUrl: string;
  enabled: boolean;
  notifyOn: {
    testComplete: boolean;
    testFailure: boolean;
    thresholdExceeded: boolean;
  };
  thresholds: {
    failurePercentage: number;
  };
  channel: string;
}

export interface TestSummary {
  pillar: string;
  environment: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  passRate: number;
}

export interface FlakyTest {
  test: string;
  runs: number;
  failures: number;
  flakyRate: number;
}

export interface TrendData {
  date: string;
  passRate: number;
  avgDuration: number;
  totalTests: number;
}

export type Environment = 'local' | 'dev' | 'sandbox' | 'staging';
export type Pillar = 'synthetic' | 'integration' | 'performance';
