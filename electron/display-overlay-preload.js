const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('displayOverlayAPI', {
    onApplyFilter: (callback) => {
        ipcRenderer.on('DISPLAY_FILTER:APPLY_FILTER', (event, payload) => callback(payload));
    }
});
