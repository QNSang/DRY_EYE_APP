import { DisplayFilterPayload } from './DisplayProfiles';

/**
 * Sends Display Filter settings to Electron Main process.
 */
export function applyDisplaySettings(payload: DisplayFilterPayload) {
    try {
        const api = (window as any).electronAPI;
        if (api && api.display) {
            console.log('[DisplayClient] Applying:', payload.profileId);
            api.display.apply(payload);
        } else {
            console.warn('[DisplayClient] Electron API not found.');
        }
    } catch (e) {
        console.error('[DisplayClient] Error applying settings:', e);
    }
}
