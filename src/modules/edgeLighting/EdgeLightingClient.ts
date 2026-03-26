/**
 * Edge Lighting Client Module
 * Handles safe communication with Electron Main Process for overlay effects.
 */

export function triggerEdgeLighting(enabled: boolean, quiet: boolean, type: string = 'standard'): void {
    try {
        const api = (window as any).electronAPI || (window as any).electron;

        if (api && api.edgeLighting) {
            // New API
            api.edgeLighting.trigger({ enabled, quiet, type });
        } else if (api && api.triggerEdgeLighting) {
            // Deprecated/Legacy fallback
            api.triggerEdgeLighting({ enabled, quiet, type });
        } else {
            console.warn('[EdgeLighting] Electron API not found. Overlay skipped.');
        }
    } catch (error) {
        // Fail silent to not crash the app
        console.error('[EdgeLighting] Trigger failed:', error);
    }
}
