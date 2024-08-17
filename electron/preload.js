const { contextBridge, ipcRenderer, shell } = require('electron');
const auth0 = require('auth0-js');
const spenceDomain = process.env.SPENCE_DOMAIN
const redirectUri = `${spenceDomain}oauth_token/?autopilot=true&state=none`

contextBridge.exposeInMainWorld(
    'electron',
    {
        SPENCE_DOMAIN: process.env.SPENCE_DOMAIN,
        AMPLIFY_DOMAIN: process.env.AMPLIFY_DOMAIN,
        ipcRenderer: {
            send: (channel, data) => {
                ipcRenderer.send(channel, data);
            },
            on: (channel, func) => {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        getJobContent: async (content_type, job) => {
            console.log(job, 'window.electron.getJobContent');
            const response = await ipcRenderer.invoke('get-job-content', { content_type, job });
            return response;
        },
        getNodeEnv: () => process.env.NODE_ENV,

        onNewWindowRequest: (callback) => {
            ipcRenderer.on('open-url-in-webview', (event, newUrl) => {
                callback(newUrl);
            });
        },
        onUpdateAvailable: (callback) => {
            ipcRenderer.on('update-available', (event) => callback());
        },
        onUpdateDownloaded: (callback) => {
            ipcRenderer.on('update-downloaded', (event) => callback());
        },
        onUpdateProgress: (callback) => {
            ipcRenderer.on('download-progress', (event, progressObj) => callback(progressObj));
        },
        restartApp: () => {
            ipcRenderer.send('restart-app');
        },
        toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen'),
        toggleNarrowWidth: () => ipcRenderer.send('toggle-narrow-width'),
        sendJobDetails: (jobDetails) => ipcRenderer.send('job-details', jobDetails),
        onJobDetails: (callback) => ipcRenderer.on('job-details', (event, ...args) => callback(...args)),
        getAppPath: () => ipcRenderer.invoke('get-app-path'),
        getDirname: () => ipcRenderer.invoke('get-dirname'),
        showAlert: (message) => {
            alert(`Preload says: ${message}`);
        },
        sendSetupSaved: (setupData) => ipcRenderer.send('setup-saved', setupData),
        onSetupCompleted: (callback) => {
            ipcRenderer.on('setup-completed', (event, setupData) => {
                console.log('preload.js.setup-completed', setupData);
                callback(setupData);
            });
        },
        removeSetupCompletedListener: () => {
            ipcRenderer.removeAllListeners('setup-completed');
        },
        onJobNew: (callback) => {
            ipcRenderer.on('new-job', (event, jobData) => {
                // console.log('preload.js.onJobNew', jobData)
                callback(jobData);
            });
        },
        addNegativeKeyword: (keyword) => {
            ipcRenderer.send('add-negative-keyword', keyword);
        },
        addCompanyFilter: (companyFilter) => {
            ipcRenderer.send('add-company-filter', companyFilter);
        },
        removeJobNewListener: () => {
            ipcRenderer.removeAllListeners('new-job');
        },
        loadUser: () => {
            console.log('preload.js.loadUser')
            ipcRenderer.send('load-user')
        },
        onAuthComplete: (callback) => ipcRenderer.on('auth-complete', callback),
        sendAuthCallback: (fullUrl) => {
            const urlParams = new URLSearchParams(fullUrl);
            const token = urlParams.get('token');
            const userid = urlParams.get('id');
            ipcRenderer.send('auth-callback', { token, userid });
        },
        searchCycleCompleted: (dte) => {
            console.log('preload.js.searchCycleCompleted', dte);
            ipcRenderer.send('search-cycle-completed', dte);
        },
        reloadUser: (token) => {
            console.log('preload.js.reloadUser', token);
            ipcRenderer.send('reload-user', token);
        },
        onUserReloaded: (callback) => ipcRenderer.on('reloadUserResponse', callback),
        onUserData: (callback) => ipcRenderer.on('userDataResponse', callback),
        isLoggedIn: () => ipcRenderer.invoke('is-logged-in'),
        isLoggedInAndSetup: () => ipcRenderer.invoke('is-logged-in-setup'),
        saveJob: (jobData) => {
            // console.log('preload.js.saveJob', jobData)
            ipcRenderer.send('save-job', jobData)
        },
        userSaveJob: (jobData) => {
            // console.log('preload.js.saveJob', jobData)
            ipcRenderer.send('user-save-job', jobData)
        },
        saveCoverletter: (coverletter) => {
            // console.log('preload.js.saveJob', jobData)
            ipcRenderer.send('save-coverletter', coverletter)
        },
        voteJob: (jobData) => {
            // console.log('preload.js.saveJob', jobData)
            ipcRenderer.send('vote-job', jobData)
        },
        saveSettings: (config) => ipcRenderer.send('save-settings', config),
        checkJobCompletion: (sessionid) => ipcRenderer.invoke('check-job-completion', { sessionid }),
        logout: async () => {
            ipcRenderer.send('logout')
            // shell.openExternal('https://app.getspence.ai/logout/');
        },
        loginWithRedirect: async () => {
            try {
                const auth0Client = new auth0.WebAuth({
                    domain: 'dev-5u51zijdqldlv4t4.us.auth0.com',
                    clientID: 'To3yLHtfQHI6G8e4SVYXYdnB9IBddQIr',
                    redirectUri: redirectUri,
                    responseType: 'code',
                    scope: 'email',
                });

                const url = auth0Client.client.buildAuthorizeUrl({
                    clientID: 'To3yLHtfQHI6G8e4SVYXYdnB9IBddQIr',
                    responseType: 'code',
                    redirectUri: redirectUri,
                });
                shell.openExternal(url);
            } catch (error) {
                console.error('Login failed:', error);
            }
        },
        authenticateLinkedIn: () => {
            ipcRenderer.send('authenticate-linkedin');
        },
    }
);

// contextBridge.exposeInMainWorld('electronStorage', {
//     setItem: (key, value) => localStorage.setItem(key, value),
//     getItem: (key) => localStorage.getItem(key),
//     removeItem: (key) => localStorage.removeItem(key),
//     clear: () => localStorage.clear()
// });

document.addEventListener('sendJobDetails', (event) => {
    console.log('in document.addEventListener(sendJobDetails)')
    ipcRenderer.send('job-details', event.detail);
});


ipcRenderer.send('variable-request', ['somevar', 'anothervar']);

ipcRenderer.on('variable-reply', function (event, args) {
    console.log(args, 'args');
});
