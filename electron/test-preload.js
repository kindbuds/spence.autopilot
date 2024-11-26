// test-preload.js

const { contextBridge, ipcRenderer } = require('electron');
const shared = require('./helpers/shared.js')
contextBridge.exposeInMainWorld('electronAPI', {
    jobDiscovered: (job) => {
        job.id = shared.getGuid();
        ipcRenderer.send('job-discovered', job);
    },
    showAlert: (message) => {
        alert(`Preload says: ${message}`);
    },

    doLog: (log) => {
        ipcRenderer.send('do-log', log);
    },
    // logMessage: (message) => {
    //     console.log(`Preload log: ${message}`);
    // },
    // sendTestIPC: () => {
    //     ipcRenderer.send('test-message', 'Hello from Preload');
    // },
    // receiveMessage: () => {
    //     ipcRenderer.on('reply-test-message', (event, arg) => {
    //         document.body.innerHTML += `<p>Received reply: ${arg}</p>`; // Assuming you have a body element in your HTML
    //     });
    // }
});

// Immediate feedback that preload.js has been loaded
console.log("test-preload.js has been loaded successfully.");
