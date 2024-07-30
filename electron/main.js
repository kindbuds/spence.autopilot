const { app, BrowserWindow, Menu, ipcMain, protocol, screen, shell, dialog, autoUpdater } = require('electron');
// const { autoUpdater } = require('electron-updater');
const { build } = require('./package.json');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const storage = require('electron-json-storage');
const appData = app.getPath('appData');
// const vShared = require('./vue-app/src/helpers/shared.js')
const eShared = require('./helpers/shared.js')
eShared.logtofile(`storage located @: ${path.join(appData, build.productName)}`);
storage.setDataPath(path.join(appData, build.productName));
eShared.logtofile('Data will now be stored at:' + storage.getDataPath());
require('dotenv').config();
let loaderWindow, mainWindow, authWindow;
const isDev = process.env.NODE_ENV === 'development';
const amplifyUri = process.env.AMPLIFY_DOMAIN
const spenceDomain = process.env.SPENCE_DOMAIN


if (require('electron-squirrel-startup')) return;
const { updateElectronApp } = require('update-electron-app')
updateElectronApp({
    logger: require('electron-log')
})

// This makes sure the app is single-instance
const gotTheLock = app.requestSingleInstanceLock();
console.log(gotTheLock, 'gotTheLock')
eShared.logtofile(`gotTheLock: ${gotTheLock}`)

if (!gotTheLock) {
    console.log("Quitting application, instance already running.");
    app.quit();
} else {
    app.on('second-instance', async (event, commandLine, workingDirectory) => {
        eShared.logtofile(`Command Line: ${JSON.stringify(commandLine)}`);
        eShared.logtofile(`Second instance detected: ${commandLine}`);
        const protocolUrl = commandLine[commandLine.length - 1];
        eShared.logtofile(`protocolUrl: ${protocolUrl}`);
        eShared.logtofile(`loaderWindow: ${JSON.stringify(loaderWindow)}`);

        if (protocolUrl) {
            await handleAuthCallback(protocolUrl); // Modify this function to handle the protocol logic
        }
    });


    app.whenReady().then(async () => {
        console.log('running app.whenReady()')

        await createWindow();
        ipcMain.on('search-cycle-completed', async (event, dte) => {
            await eShared.setLastSearchCycleCompleted(dte);
        });

        async function loadUserData(userid) {
            let checkObj = await sendToApi(`${api.api2Url}autopilot/check`, {
                userid: userid,
                sessionid: -1
            }, 'json');
            const existing_jobs = checkObj.jobs;
            console.log(existing_jobs.length, 'existing_jobs')
            const usage = checkObj.usage;
            console.log(usage, 'usage')

            return { existing_jobs, usage };
        }

        ipcMain.on('reload-user', async (event, token) => {
            const payload = {
                access_token: token,
                autopilot: true,
            };
            let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
            gptUser.token = token;

            const userData = await loadUserData(gptUser.userid);
            gptUser.existing_jobs = userData.existing_jobs;

            eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

            await eShared.setAuth(gptUser, eShared.logtofile);
            eShared.logtofile('User was successfully reloaded.');
            event.reply('reloadUserResponse', gptUser);
        });

        ipcMain.on('load-user', async (event) => {
            let user = await eShared.loadUserData()

            const userData = await loadUserData(user.userid);
            user.existing_jobs = userData.existing_jobs;

            event.reply('userDataResponse', user);
        });

        ipcMain.on('check-login-status', async (event) => {
            await createWindow(isLoggedIn);
        });
        ipcMain.on('setup-saved', async (event, setupData) => {
            console.log(setupData, 'Received setup-saved data');
            const newSetup = await sendToApi(`${api.api2Url}autopilot/setup`, setupData, 'json');
            console.log(newSetup, 'newSetup')
            let user = await eShared.loadUserData();
            user.autopilot = newSetup
            await eShared.setAuth(user, eShared.logtofile);
            event.sender.send('setup-completed', newSetup);
        });

        ipcMain.on('save-settings', async (event, config) => {
            console.log('main.save-settings', config);
            let settingsSaved = await sendToApi(`${api.api2Url}autopilot/save_config`, config);
            console.log(settingsSaved, 'settingsSaved');

            let user = await eShared.loadUserData();
            user.autopilot = config
            await eShared.setAuth(user, eShared.logtofile);
        });
        ipcMain.handle('is-logged-in', async (event) => {
            return await eShared.isLoggedIn();
        });
        ipcMain.handle('is-logged-in-setup', async (event) => {
            return await eShared.isLoggedInAndSetup();
        });

    });
}

async function createWindow(loggedin = null) {

    if (!loggedin) {
        loggedin = await eShared.isLoggedIn();
    }

    if (mainWindow) {
        mainWindow.focus();
        return;
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;


    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        title: "Spence - AI Career Autopilot",
        icon: path.join(__dirname, 'assets', 'spence-face.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js'),
            nativeWindowOpen: true,
        }
    });

    // mainWindow.loadURL(`file://${path.join(__dirname, '/vue-app/dist/index.html')}`);

    console.log(isDev, process.env.NODE_ENV, 'isDev')
    mainWindow.maximize();

    console.log(amplifyUri, 'amplifyUri')
    mainWindow.loadURL(amplifyUri);

    // Log URL changes
    mainWindow.webContents.on('did-navigate', (event, url) => {
        console.log('Navigated to:', url);
        mainWindow.webContents.executeJavaScript(`console.log('Navigated to:', '${url}');`);
    });

    mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
        console.log('Navigated within page to:', url);
        mainWindow.webContents.executeJavaScript(`console.log('Navigated within page to:', '${url}');`);
    });

    mainWindow.on('page-title-updated', (event) => {
        event.preventDefault();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.insertCSS('html, body { overflow: hidden !important; }');
        mainWindow.setTitle("Spence - AI Career Autopilot");
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorDescription);
    });
    mainWindow.webContents.on('crashed', () => {
        console.error('The web content has crashed');
    });
    mainWindow.webContents.on('unresponsive', () => {
        console.error('The web content is unresponsive');
    });

    mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
        console.log(` mainWindow.webContents.on('new-window'`)
        event.preventDefault();
        mainWindow.webContents.send('open-url-in-webview', url);
        const popupWindow = new BrowserWindow({
            width: 500,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                webviewTag: false,
                preload: path.join(__dirname, 'preload.js'),
                nativeWindowOpen: true
            }
        });
        popupWindow.loadURL(url);
        event.newGuest = popupWindow;
    });


    ipcMain.on('restart-app', () => {
        // autoUpdater.quitAndInstall();
    });
    ipcMain.on('toggle-fullscreen', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('toggle-narrow-width', () => {
        const newWidth = 450;
        const [width, height] = mainWindow.getSize();
        // console.log(width, 'width')
        if (width > newWidth) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            mainWindow.setSize(newWidth, height);
        } else {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            }
            mainWindow.setSize(800, height); // or any default width you prefer
        }
    });

    ipcMain.handle('get-job-content', async (event, { content_type, job }) => {
        const user = await eShared.loadUserData();
        delete user.token;
        delete user.existing_jobs;
        delete user.subscription;

        console.log(content_type, job, user, 'get-job-content')
        try {


            let jobContent = await sendToApi(`${api.api2Url}autopilot/composer/fetch`, { content_type, job, user }, 'json');
            console.log(jobContent, 'jobContent')


            // const response = await fetch('https://api.example.com/getJobContent', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ content_type, job, user })
            // });

            // if (!response.ok) {
            //     throw new Error(`HTTP error! Status: ${response.status}`);
            // }

            // const data = await response.json();
            return jobContent;
        } catch (error) {
            console.error('Error fetching job content:', error);
            throw error;
        }
    });


    // if (isDev)
    ipcMain.on('job-discovered', (event, arg) => {
        // console.log(arg, 'in main.js.job-discovered')
        mainWindow.webContents.send('new-job', arg);
    });

    ipcMain.on('authenticate-linkedin', (event, arg) => {
        console.log(arg, 'in main.js.authenticate-linkedin')
        // eShared.logtofile('in main.js.authenticate-linkedin');
        //  mainWindow.show();
        // createWindow();

        mainWindow.show();

        // mainWindow.loadURL('https://www.linkedin.com/jobs', {
        //     userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
        // });
    });

    mainWindow.on('closed', function () {
        eShared.logtofile('mainWindow has been closed');
        console.log('mainWindow has been closed');
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        try {
            //  if (isDev)
            setTimeout(() => {
                console.log('openDevTools');
                mainWindow.webContents.openDevTools();
            }, 1000);
        } catch {
            console.log('openDevTools failed')
        }
    });
    Menu.setApplicationMenu(null);
}


async function handleAuthCallback(fullUrl) {
    const urlObject = new URL(fullUrl);
    const token = urlObject.searchParams.get('token');
    const userid = urlObject.searchParams.get('id');
    // store.set('auth', { token, userid });
    // shared.logtofile(`Stored auth: ${JSON.stringify(store.get('auth'))}`);
    //    console.log('Received code:', code);
    eShared.logtofile(`in handleAuthCallback`)
    eShared.logtofile(`urlObject: ${JSON.stringify(urlObject)}`)
    eShared.logtofile(`Received token: ${token}`);

    // console.log(fullUrl, 'fullUrl')
    eShared.logtofile(`fullUrl: ${fullUrl}`);

    const payload = {
        access_token: token,
        autopilot: true,
    }
    try {
        let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
        gptUser.token = token;

        eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

        await eShared.setAuth(gptUser, eShared.logtofile);
        eShared.logtofile('Auth data was successfully saved.');
    } catch (error) {
        console.log(error, 'Authentication error')
        eShared.logtofile('Error during authentication process: ' + JSON.stringify(error));
    }

    await createWindow(true);
    // Replace 'protocol-action' with the actual IPC message you want to use

}



// // Load user data when the extension starts


app.on('will-finish-launching', () => {
    app.on('open-url', (event, url) => {
        event.preventDefault();
        // dialog.showErrorBox('Welcome Back', `You arrived from 2: ${url}`);
        // Additional handling code...
    });
});


app.on('window-all-closed', () => {
    console.log('in window-all-closed')
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
});

ipcMain.on('job-details', (event, jobDetails) => {
    console.log('Received job details:', jobDetails);
    // Process jobDetails as needed, e.g., send them to your Vue component
    mainWindow.webContents.send('job-details', jobDetails); // assuming `mainWindow` is your primary BrowserWindow
});

ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});

ipcMain.handle('get-dirname', async (event) => {
    return __dirname;
});

ipcMain.on('variable-request', function (event, arg) {
    event.sender.send('variable-reply', [__dirname]);
});

ipcMain.on('logout', async (event) => {
    storage.remove('auth', function (error) {
        if (error) throw error;
        console.log('User logged out, auth data removed.');
        mainWindow.loadURL(`${spenceDomain}logout/?autopilot=true`);
        // createLoaderWindow();
    });
})

ipcMain.on('auth-callback', async (event, { token, userid }) => {
    eShared.logtofile(`Received token: ${token}`);
    eShared.logtofile(`Received userid: ${userid}`);

    const payload = {
        access_token: token,
        autopilot: true,
    };
    let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
    gptUser.token = token;

    eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

    eShared.setAuth(gptUser, eShared.logtofile)
        .then(() => {
            eShared.logtofile('Auth data was successfully saved.');
            //mainWindow.webContents.send('auth-complete'); // Notify the renderer process
            mainWindow.loadURL(amplifyUri);
        })
        .catch(error => {
            eShared.logtofile('Error when setting auth data:' + error);
        });

    await createWindow(true);
});

ipcMain.handle('check-job-completion', async (event, args) => {
    try {
        const user = await eShared.loadUserData();
        const { sessionid } = args;

        let checkResponse = await sendToApi(`${api.api2Url}autopilot/check`, {
            userid: user.userid,
            sessionid: sessionid
        }, 'json');

        let autoJobs = checkResponse.jobs;
        const usage = checkResponse.usage;

        console.log(usage, 'usage')

        // Check if any job has limit_reached status
        // if (autoJobs.some(job => job.
        //     user.autopilot.limit_reached = true;
        // }

        return { jobs: autoJobs, usage }; // This will be sent back to the renderer
    } catch (error) {
        console.error('Failed to check job completion:', error);
        throw error; // This will be caught as a rejection in the renderer
    }
});


ipcMain.on('save-coverletter', async (event, coverletter) => {
    // Implement your job saving logic here
    console.log('Saving coverletter:', coverletter);
    coverletter.shape = 'coverletter';
    // For example, write to a file or database
    let coverLetterSaved = await sendToApi(`${api.api2Url}autopilot/shape_job`, coverletter);
    console.log(coverLetterSaved, 'coverLetterSaved');
});

ipcMain.on('user-save-job', async (event, jobData) => {
    // Implement your job saving logic here
    console.log('Saving job:', jobData);
    jobData.shape = 'save';
    // For example, write to a file or database
    let jobVoted = await sendToApi(`${api.api2Url}autopilot/shape_job`, jobData);
    console.log(jobVoted, 'jobVoted');
});


ipcMain.on('save-job', async (event, jobData) => {
    // Implement your job saving logic here
    console.log('Saving job:', jobData);
    // For example, write to a file or database

    if (jobData.dupe) {
        console.log('skipping saving dupe job')
        return;
    }

    jobData.siteid = jobData.siteId;
    delete jobData.siteId;

    // console.log(jobData, 'autoPilot.addJob')
    let userdata = await eShared.loadUserData();
    // console.log(userdata, "userdata")
    jobData.user = {
        guid: userdata.userid,
        about: userdata.about,
        language: userdata.language,
        resume: userdata.resume.optimized_text
    }
    let jobUploaded = await sendToApi(`${api.api2Url}autopilot/upload_job`, jobData);
    // console.log(jobUploaded, 'jobUploaded');
});





ipcMain.on('vote-job', async (event, voteData) => {
    console.log('Voting job:', voteData);
    voteData.shape = 'vote';
    let jobVoted = await sendToApi(`${api.api2Url}autopilot/shape_job`, voteData);
    console.log(jobVoted, 'jobVoted');
});


const api = {
    baseUrl: process.env.API_BASE,
    spenceUrl: process.env.API_SPENCE,
    api2Url: process.env.API_API2,
};

const sendToApi = async (url, data, response_type = 'text') => {
    eShared.logtofile(`sendToApi: ${url} ${JSON.stringify(data)}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let response_data;

        switch (response_type) {
            case 'text':
                response_data = await response.text();
                break;
            case 'json':
                response_data = await response.json();
                break;
            default:
                response_data = response.arrayBuffer()
                break;
        }

        // eShared.logtofile(`response_data: ${JSON.stringify(response_data)}`)
        return response_data;
    } catch (error) {
        // console.error('Error:', error);
        throw error;  // If you want the error to be propagated to the caller
    }
};
