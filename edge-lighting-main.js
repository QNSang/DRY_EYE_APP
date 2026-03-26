const { BrowserWindow, ipcMain, screen, app } = require('electron');
const path = require('path');

let overlayWindow = null;
let hideOverlayTimer = null;
let lastTriggerTime = 0;
let isInitializing = false;

// Robust path resolution for preload script
const getPreloadPath = () => {
    // Check if packaged
    if (app.isPackaged) {
        // In Prod, we expect the file to be in the resources or app bundle. 
        // Adapting based on common Electron builders: often in accessible resources.
        // Try resolving from app.getAppPath()
        return path.join(app.getAppPath(), 'electron', 'overlay-preload.js');
    } else {
        // In Dev, relative to root
        return path.resolve(process.cwd(), 'electron', 'overlay-preload.js');
    }
};

const initEdgeLighting = () => {
    if (overlayWindow || isInitializing) return; // Single Instance Guard
    isInitializing = true;

    const preloadPath = getPreloadPath();
    console.log('[EdgeLighting] Init. Preload path:', preloadPath);
    console.log("EdgeLighting init ok");

    overlayWindow = new BrowserWindow({
        width: 1920, // Default large size, will be updated
        height: 1080,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        focusable: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreen: true,
        kiosk: false, // Turn off kiosk for better recording compatibility
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            backgroundThrottling: false
        }
    });

    // Hardening: Click-through
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    // Hardening: Always above screen savers / fullscreen apps
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    // Dev/Prod Loading
    if (!app.isPackaged) {
        overlayWindow.loadURL('http://localhost:5174/overlay.html');
    } else {
        overlayWindow.loadFile(path.join(app.getAppPath(), 'dist', 'overlay.html'));
    }

    // Cleanup when window is closed (unexpectedly)
    overlayWindow.on('closed', () => {
        overlayWindow = null;
        isInitializing = false;
    });

    overlayWindow.on('ready-to-show', () => {
        isInitializing = false;
    });

    // Setup IPC
    setupIPC();
};

const setupIPC = () => {
    // Only add listener once or valid check
    // We remove old listeners to be safe if this function is called multiple times (though init is guarded)
    ipcMain.removeAllListeners('EDGE_LIGHTING:TRIGGER');

    ipcMain.on('EDGE_LIGHTING:TRIGGER', (event, { enabled, quiet, type }) => {
        console.log("EDGE_LIGHTING:TRIGGER received", { enabled, quiet, type });
        if (!overlayWindow) {
            console.warn('[EdgeLighting] Window missing, recreating...');
            initEdgeLighting();
            return;
        }

        if (!enabled || quiet) {
            return;
        }

        // Anti-spam Cooldown (except for vitality which handles its own timing)
        const now = Date.now();
        const cooldownMs = type === 'vitality' ? 0 : 3000; // Reduced from 8s to 3s for demo snappiness
        if (now - lastTriggerTime < cooldownMs) {
            console.log(`[EdgeLighting] Cooldown active for type: ${type}`);
            return;
        }
        lastTriggerTime = now;

        // Multi-monitor: Move to display with mouse
        try {
            const point = screen.getCursorScreenPoint();
            const display = screen.getDisplayNearestPoint(point);
            if (display) {
                overlayWindow.setBounds(display.bounds);
            }
        } catch (e) {
            console.error('[EdgeLighting] Error setting bounds:', e);
        }

        // Show and Animate
        overlayWindow.setAlwaysOnTop(true, 'floating', 1);
        overlayWindow.showInactive();
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });

        overlayWindow.webContents.send('PLAY_ANIMATION', { type });

        // Auto-hide logic (Standard 6s, or 21s for Vitality)
        const displayDuration = type === 'vitality' ? 21000 : 6000;
        if (hideOverlayTimer) clearTimeout(hideOverlayTimer);
        hideOverlayTimer = setTimeout(() => {
            if (overlayWindow && !overlayWindow.isDestroyed()) {
                overlayWindow.hide();
            }
        }, displayDuration);
    });
};

module.exports = { initEdgeLighting };
