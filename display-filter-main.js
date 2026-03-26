const { BrowserWindow, ipcMain, screen, app } = require('electron');
const path = require('path');
const magnifier = require('./electron/native/windows-magnifier'); // Native module

const displayWindows = new Map(); // Manages windows per display
let currentSettings = { enabled: false }; // Cache last settings

// Initialize Native API (Windows only)
if (process.platform === 'win32') {
    magnifier.init();
    // Ensure cleanup
    app.on('quit', () => {
        magnifier.setIdentity();
        magnifier.uninit();
    });
}

const getPreloadPath = () => {
    return path.join(app.getAppPath(), 'electron', 'display-overlay-preload.js');
};

const createOverlayForDisplay = (display) => {
    if (displayWindows.has(display.id)) return; // Already exists

    const preloadPath = getPreloadPath();
    console.log(`[DisplayFilter] Creating window for display ${display.id} bounds:`, display.bounds);

    const win = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        transparent: true,
        frame: false,
        focusable: false,
        fullscreenable: true,
        resizable: false,
        hasShadow: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        enableLargerThanScreen: true,
        show: false, // Wait until ready or applied
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            backgroundThrottling: false
        }
    });

    // Hardening
    win.setIgnoreMouseEvents(true, { forward: true });
    win.setAlwaysOnTop(true, 'screen-saver');

    // NOTE: setVisibleOnAllWorkspaces helps with Mac/Linux mostly, 
    // but on Windows 'screen-saver' level is usually enough. 
    // We add it for completeness.
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Load Content
    if (!app.isPackaged) {
        win.loadURL('http://localhost:5174/display-overlay.html');
    } else {
        win.loadFile(path.join(app.getAppPath(), 'dist', 'display-overlay.html'));
    }

    win.on('ready-to-show', () => {
        // If enabled, show and apply current settings immediately
        if (currentSettings.enabled) {
            win.showInactive();
            win.webContents.send('DISPLAY_FILTER:APPLY_FILTER', currentSettings);
        }
    });

    win.on('closed', () => {
        displayWindows.delete(display.id);
    });

    // Store reference
    displayWindows.set(display.id, win);
};

const initDisplayFilter = () => {
    // 1. Initial Setup for all displays
    screen.getAllDisplays().forEach(createOverlayForDisplay);

    // 2. Handle Display Changes (Hot-plugging)
    screen.on('display-added', (event, display) => createOverlayForDisplay(display));

    screen.on('display-removed', (event, display) => {
        const win = displayWindows.get(display.id);
        if (win) {
            win.destroy();
            displayWindows.delete(display.id);
        }
    });

    // Handle resolution changes, etc.
    screen.on('display-metrics-changed', (event, display) => {
        const win = displayWindows.get(display.id);
        if (win) {
            win.setBounds(display.bounds);
        }
    });

    // 3. Register IPC Handler
    setupIPC();
};

const setupIPC = () => {
    ipcMain.on('DISPLAY_FILTER:APPLY', (event, payload) => {
        console.log('[DisplayFilter] Applying settings:', payload.profileId, 'Enabled:', payload.enabled);

        // Validation / Clamping
        // Ensure 0-100 for ranges using Math.max(0, Math.min(100, val))
        // New Schema: warmthK (3000-6500), brightnessPct (0-100)
        const safePayload = {
            ...payload,
            warmthK: Math.max(1000, Math.min(10000, payload.warmthK || 6500)), // Broad range safety
            brightnessPct: Math.max(0, Math.min(100, payload.brightnessPct ?? 100)),
            contrastPct: Math.max(0, Math.min(200, payload.contrastPct ?? 100)), // Allow up to 200%
            saturationPct: Math.max(0, Math.min(200, payload.saturationPct ?? 100)),
            grayscale: !!payload.grayscale,
            invert: !!payload.invert
        };

        // Cache for new windows
        currentSettings = safePayload;

        // --- Native OS Handling (Windows) ---
        let nativeHandled = false;
        if (process.platform === 'win32') {
            console.log('[DisplayFilter] Attempting Native Effect. Enabled:', safePayload.enabled, 'Gray:', safePayload.grayscale);
            if (safePayload.enabled) {
                if (safePayload.invert) {
                    const ok = magnifier.setInvert();
                    console.log('[DisplayFilter] Native Invert Result:', ok);
                    nativeHandled = true;
                } else if (safePayload.grayscale) {
                    const ok = magnifier.setGrayscale();
                    console.log('[DisplayFilter] Native Grayscale Result:', ok);
                    nativeHandled = true;
                } else {
                    magnifier.setIdentity();
                }
            } else {
                magnifier.setIdentity();
            }
        }

        // --- Prepare Payload for Overlay ---
        // If native handled invert/grayscale, we tell overlay NOT to do it (avoid double apply or ghosting)
        // Also if we use native mag, we might NOT want overlay invert? 
        // Actually, Mag API inverts EVERYTHING including our overlay.
        // So if we invert via Mag API, our overlay (if visible) will also be inverted.
        // If our overlay is applying "warmth" (Amber), getting inverted turning it Blue?
        // NO, usually we want "Editing" to be Invert ONLY or Invert + Warmth?
        // CareUEyes Editing description: "Invert the screen color... suitable for editing text" (usually High Contrast Black/White).
        // Usually NO warmth in Editing mode (Warmth 6500K in preset means NO warmth).
        // So overlay is transparent. Invert happens on desktop. Correct.

        // Reading mode: Grayscale. Warmth 6500K (per my update) -> No Warmth overlay.
        // So Overlay is transparent. Grayscale happens on desktop. Correct.

        // What if user customizes? Grayscale + Warmth?
        // Mag API turns everything grayscale. If overlay adds Amber tint, Mag API keeps it grayscale (Amber becomes gray).
        // That seems acceptable/correct for E-ink feel.

        const overlayPayload = {
            ...safePayload,
            invert: false, // Handled by OS or ignored
            grayscale: false // Handled by OS or ignored
        };


        // Apply to ALL windows
        displayWindows.forEach((win) => {
            if (!win.isDestroyed()) {
                if (safePayload.enabled) {
                    if (!win.isVisible()) {
                        win.showInactive();
                        // Reinforce top-most
                        win.setAlwaysOnTop(true, 'screen-saver');
                        win.setIgnoreMouseEvents(true, { forward: true });
                    }
                    win.webContents.send('DISPLAY_FILTER:APPLY_FILTER', overlayPayload);
                } else {
                    // If disabled, just hide the window to save resources/gpu
                    win.hide();
                }
            }
        });
    });
};

module.exports = { initDisplayFilter };
