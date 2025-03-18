import { apiRequest } from './queryClient';
import { ScrewResult } from '@shared/schema';

export interface ProcessingResult {
  id: number;
  sessionId: string;
  side: string;
  meanXMedial: string;
  meanXLateral: string;
  results: ScrewResult[];
  processedAt: Date;
  tolerance: string;
  logs: string;
}

export async function uploadFiles(
  sessionId: string,
  medialFile: File | null,
  lateralFile: File | null, 
  screwsFile: File | null
): Promise<{ success: boolean, message?: string }> {
  try {
    if (!medialFile || !lateralFile || !screwsFile) {
      return { 
        success: false, 
        message: 'Missing required files (medial surface, lateral surface, and screws)' 
      };
    }

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('medial', medialFile);
    formData.append('lateral', lateralFile);
    formData.append('screws', screwsFile);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, message: error.message || 'Upload failed' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function processFiles(
  sessionId: string,
  tolerance: string = '0.5'
): Promise<ProcessingResult> {
  const response = await apiRequest('POST', '/api/process', {
    sessionId,
    tolerance
  });
  
  const result = await response.json();
  return {
    ...result,
    results: typeof result.results === 'string' ? JSON.parse(result.results) : result.results
  };
}

export async function getProcessingResults(
  sessionId: string
): Promise<ProcessingResult | null> {
  try {
    const response = await fetch(`/api/results/${sessionId}`, {
      credentials: 'include',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }

    const result = await response.json();
    return {
      ...result,
      results: typeof result.results === 'string' ? JSON.parse(result.results) : result.results
    };
  } catch (error) {
    console.error('Error fetching processing results:', error);
    throw error;
  }
}

export async function saveSettings(
  userId: number,
  settings: {
    tolerance: string;
    colorScheme: string;
    showAxes: boolean;
    showMeasurements: boolean;
    highlightBreaches: boolean;
    enableTransparency: boolean;
  }
): Promise<any> {
  const response = await apiRequest('POST', '/api/settings', {
    userId,
    ...settings
  });
  
  return await response.json();
}

export async function getSettings(userId?: number): Promise<any> {
  try {
    const url = userId ? `/api/settings/${userId}` : '/api/settings/default';
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}
