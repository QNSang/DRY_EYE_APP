const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
    edgeLighting: {
        trigger: (payload) => ipcRenderer.send('EDGE_LIGHTING:TRIGGER', payload)
    },
    display: {
        apply: (payload) => ipcRenderer.send('DISPLAY_FILTER:APPLY', payload)
    },
    triggerEdgeLighting: (payload) => ipcRenderer.send('EDGE_LIGHTING:TRIGGER', payload), // Deprecated alias
    systemNotification: (payload) => ipcRenderer.send('SYSTEM_NOTIFICATION', payload)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
// Backward compatibility
contextBridge.exposeInMainWorld('electron', electronAPI);

