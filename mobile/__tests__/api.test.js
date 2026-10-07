import { describe, it, expect } from 'vitest';
import { apiClient } from '../src/api/client.js';

describe('Mobile API Client Configuration', () => {
  it('includes X-App-Token and mobile headers in request configuration', () => {
    const headers = apiClient.getHeaders();
    expect(headers['X-App-Token']).toBe('gulshan_app_secret_token_2026');
    expect(headers['X-Client-Platform']).toBe('mobile');
    expect(headers['X-Requested-With']).toBe('com.khabokothay.app');
  });

  it('formats photo proxy URLs correctly', () => {
    const url = apiClient.getPhotoUrl('places/sample/photos/1', 500);
    expect(url).toContain('/api/places/photo?name=');
    expect(url).toContain('maxWidth=500');
  });
});
