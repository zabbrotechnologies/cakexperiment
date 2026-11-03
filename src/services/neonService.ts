/**
 * Neon Service Client
 * 
 * Provides unified access to:
 * 1. Neon Lakebase Postgres (via @neondatabase/serverless & /api/neon endpoints)
 * 2. Neon Object Storage (S3-compatible bucket 'assets')
 */

export interface NeonStatus {
  connected: boolean;
  branch: string;
  database: {
    connected: boolean;
    name: string;
    user: string;
    version: string;
    latencyMs: number;
  };
  objectStorage: {
    connected: boolean;
    bucket: string;
    endpoint: string;
    region: string;
    assetCount: number;
  };
  error?: string;
}

export interface MediaAsset {
  key: string;
  size?: number;
  lastModified?: string;
  url?: string;
}

class NeonService {
  /**
   * Check connection status to both Neon Postgres and Neon Object Storage
   */
  async getStatus(): Promise<NeonStatus> {
    try {
      const response = await fetch('/api/neon/status');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      return {
        connected: false,
        branch: 'production',
        database: {
          connected: false,
          name: 'neondb',
          user: 'neondb_owner',
          version: '',
          latencyMs: 0
        },
        objectStorage: {
          connected: false,
          bucket: 'assets',
          endpoint: '',
          region: 'us-east-2',
          assetCount: 0
        },
        error: err.message || 'Failed to connect to Neon backend'
      };
    }
  }

  /**
   * Execute a query against Neon Postgres via backend API
   */
  async query<T = any>(queryText: string, params?: any[]): Promise<T[]> {
    const response = await fetch('/api/neon/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, params })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Database query failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.rows as T[];
  }

  /**
   * Upload an asset to Neon Object Storage
   */
  async uploadAsset(file: File | Blob, key: string, contentType?: string): Promise<{ success: boolean; key: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    if (contentType) {
      formData.append('contentType', contentType);
    }

    const response = await fetch('/api/neon/storage/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * List assets in the Neon Object Storage bucket
   */
  async listAssets(prefix?: string): Promise<MediaAsset[]> {
    const query = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    const response = await fetch(`/api/neon/storage/list${query}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to list assets (${response.status})`);
    }

    const data = await response.json();
    return data.assets || [];
  }
}

export const neonService = new NeonService();

