/**
 * Tests for OAuthHelper
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OAuthHelper } from '../../../shared/auth/oauth-helper.js';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('OAuthHelper', () => {
  let oauthHelper: OAuthHelper;
  const config = {
    issuer: 'https://oauth.example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
    scope: 'openid profile email',
  };

  beforeEach(() => {
    oauthHelper = new OAuthHelper(config);
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authenticateWithPassword', () => {
    it('should authenticate with valid credentials', async () => {
      const mockTokens = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        id_token: 'id_token_123',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const result = await oauthHelper.authenticateWithPassword('user@example.com', 'password123');

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error on authentication failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      } as Response);

      await expect(
        oauthHelper.authenticateWithPassword('user@example.com', 'wrong-password')
      ).rejects.toThrow(/Authentication failed: 401/);
    });

    it('should throw error on network failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        oauthHelper.authenticateWithPassword('user@example.com', 'password123')
      ).rejects.toThrow(/OAuth password authentication failed/);
    });
  });

  describe('authenticateWithClientCredentials', () => {
    it('should authenticate with client credentials', async () => {
      const mockTokens = {
        access_token: 'access_token_123',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'api:read api:write',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const result = await oauthHelper.authenticateWithClientCredentials();

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when client secret is missing', async () => {
      const helperWithoutSecret = new OAuthHelper({
        ...config,
        clientSecret: undefined,
      });

      await expect(
        helperWithoutSecret.authenticateWithClientCredentials()
      ).rejects.toThrow(/Client secret is required/);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const mockTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const result = await oauthHelper.refreshAccessToken('old_refresh_token');

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error on refresh failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token',
      } as Response);

      await expect(
        oauthHelper.refreshAccessToken('invalid_token')
      ).rejects.toThrow(/Token refresh failed: 400/);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL', () => {
      const url = oauthHelper.getAuthorizationUrl('test-state');

      expect(url).toContain('https://oauth.example.com/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=openid+profile+email');
    });

    it('should throw error when redirect URI is missing', () => {
      const helperWithoutRedirect = new OAuthHelper({
        ...config,
        redirectUri: undefined,
      });

      expect(() => helperWithoutRedirect.getAuthorizationUrl()).toThrow(
        /Redirect URI is required/
      );
    });

    it('should generate random state when not provided', () => {
      const url1 = oauthHelper.getAuthorizationUrl();
      const url2 = oauthHelper.getAuthorizationUrl();

      const state1 = new URL(url1).searchParams.get('state');
      const state2 = new URL(url2).searchParams.get('state');

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockTokens = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_123',
        id_token: 'id_token_123',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockTokens,
      } as Response);

      const result = await oauthHelper.exchangeCodeForTokens('auth_code_123');

      expect(result).toEqual(mockTokens);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth.example.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should throw error when redirect URI is missing', async () => {
      const helperWithoutRedirect = new OAuthHelper({
        ...config,
        redirectUri: undefined,
      });

      await expect(
        helperWithoutRedirect.exchangeCodeForTokens('auth_code_123')
      ).rejects.toThrow(/Redirect URI is required/);
    });

    it('should throw error on code exchange failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid authorization code',
      } as Response);

      await expect(
        oauthHelper.exchangeCodeForTokens('invalid_code')
      ).rejects.toThrow(/Code exchange failed: 400/);
    });
  });
});
