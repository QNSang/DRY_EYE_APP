const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayAPI', {
    onPlayAnimation: (callback) => {
        ipcRenderer.on('PLAY_ANIMATION', (event, data) => callback(data));
    }
});
