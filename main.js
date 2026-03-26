const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');

// Configure Menu for standard shortcuts (Zoom, Refresh, etc.)
const template = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { role: 'close' }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
const { initEdgeLighting } = require('./edge-lighting-main');
const { initDisplayFilter } = require('./display-filter-main');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// requires 'electron-squirrel-startup' module, disabled for dev
// if (require('electron-squirrel-startup')) {
//    app.quit();
// }

let mainWindow;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#111827',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'public/icon.png')
    });

    // Handle Camera Permissions Automatically
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true);
        } else {
            callback(false);
        }
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Initialize Edge Lighting (New Module)
    initEdgeLighting();

    // Initialize Display Filter (Multi-monitor)
    initDisplayFilter();
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // IPC: System Notification (Native OS)
    ipcMain.on('SYSTEM_NOTIFICATION', (event, { title, body }) => {
        const { Notification } = require('electron');
        if (Notification.isSupported()) {
            new Notification({
                title: title,
                body: body,
                icon: path.join(__dirname, 'public/icon.png')
            }).show();
        }
    });

});


app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
