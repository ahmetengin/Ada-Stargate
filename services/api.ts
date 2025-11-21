
// services/api.ts

/**
 * Checks if the Python backend is reachable.
 * Used for the status indicator in the UI.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    // Set a short timeout to avoid hanging the UI if backend is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:8000/', { 
      method: 'GET',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Backend is likely not running or blocked
    return false;
  }
};
