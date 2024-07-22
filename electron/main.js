const { app, BrowserWindow, Menu, ipcMain, protocol, screen, shell, dialog, autoUpdater } = require('electron');
// const { autoUpdater } = require('electron-updater');
const { build } = require('./package.json');
const path = require('path');
const { spawn } = require('child_process');

const storage = require('electron-json-storage');
const fs = require('fs');
const appData = app.getPath('appData');
// const vShared = require('./vue-app/src/helpers/shared.js')
const eShared = require('./helpers/shared.js')
eShared.logtofile(`storage located @: ${path.join(appData, build.productName)}`);
storage.setDataPath(path.join(appData, build.productName));
eShared.logtofile('Data will now be stored at:' + storage.getDataPath());
require('dotenv').config();
let loaderWindow, mainWindow, authWindow;
const isDev = process.env.NODE_ENV === 'development';
// const auth0 = require('auth0-js');
// const redirectUri = 'https://app.getspence.ai/oauth_token/?autopilot=true'
// const redirectUri = 'http://localhost:3000/?autopilot=true'
// const loginUri = 'https://app.getspence.ai/?autopilot=true'
const amplifyUri = !isDev
    ? 'https://main.d1u7axsxvin7f4.amplifyapp.com/'
    : 'http://localhost:8080/'

if (require('electron-squirrel-startup')) return;


// autoUpdater.setFeedURL({
//     provider: 'github',
//     owner: 'kindbuds',
//     repo: 'spence.autopilot',
// });
// autoUpdater.logger = require("electron-log");
// autoUpdater.logger.transports.file.level = "info";

// // Set up autoUpdater event listeners
// autoUpdater.on('checking-for-update', () => {
//     console.log('Checking for update...');
//     eShared.logtofile('Checking for update...')
// });

// autoUpdater.on('update-available', (info) => {
//     console.log('Update available:', info);
//     eShared.logtofile('Update available:')
//     eShared.logtofile(info)

//     dialog.showMessageBox({
//         type: 'info',
//         title: 'Update Available',
//         message: 'A new version is available. It will be installed after restart.',
//         buttons: ['Restart', 'Later']
//     }).then((result) => {
//         if (result.response === 0) { // The user chose to restart now
//             autoUpdater.quitAndInstall();
//         }
//     });
// });

// autoUpdater.on('update-not-available', (info) => {
//     console.log('Update not available:', info);
//     eShared.logtofile('Update not available:')
//     eShared.logtofile(info)
// });

// autoUpdater.on('error', (err) => {
//     eShared.logtofile('Error in auto-updater:');
//     eShared.logtofile(err)

//     dialog.showMessageBox({
//         type: 'error',
//         title: 'Update Error',
//         message: `There was a problem updating the application.

//         ${err.message || err.toString()}

//         ${JSON.stringify(err)}
//         `
//     });
// });

// autoUpdater.on('download-progress', (progressObj) => {
//     let log_message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
//     console.log(log_message);
// });

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded; will install now:', info);
    dialog.showMessageBox({
        title: 'Installation Ready',
        message: 'The update has downloaded and will be installed now.'
    }).then(() => {
        autoUpdater.quitAndInstall();
    });
});
/*
    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('error', message => {
        log.error('There was a problem updating the application');
        log.error(message);
    });

    autoUpdater.on('update-downloaded', () => {
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: info.releaseName,
            detail: 'A new version has been downloaded. Restart the application to apply the updates.'
        };

        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            if (returnValue.response === 0) autoUpdater.quitAndInstall();
        });

        mainWindow.webContents.send('update-downloaded');
    });

    autoUpdater.on('download-progress', (progressObj) => {
        mainWindow.webContents.send('download-progress', progressObj);
    });
*/



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

        // dialog.showErrorBox('Welcome Back', `You arrived from 1: ${commandLine.pop().slice(0, -1)}`)


        if (protocolUrl) {
            await handleAuthCallback(protocolUrl); // Modify this function to handle the protocol logic
        }

        // app.quit();

        // // Focus on the loader window if it exists, otherwise focus on the main window
        // if (loaderWindow) {
        //     if (loaderWindow.isMinimized()) loaderWindow.restore();
        //     loaderWindow.focus();
        // } else if (mainWindow) {
        //     if (mainWindow.isMinimized()) mainWindow.restore();
        //     mainWindow.focus();
        // }
    });


    app.whenReady().then(async () => {
        console.log('running app.whenReady()')

        dialog.showMessageBox({
            type: 'info',
            title: 'Squirrel Event',
            message: `App is ready`
        });

        autoUpdater.checkForUpdates()

        updateApp = require('update-electron-app')({
            logger: require('electron-log')
        })

        updateApp({
            // repo: 'PhiloNL/electron-hello-world', // defaults to package.json
            updateInterval: '1 hour',
            notifyUser: true
        });

        const setupEvents = require('./squirrel-events');
        if (setupEvents.handleSquirrelEvent(app)) {

            dialog.showMessageBox({
                type: 'info',
                title: 'Squirrel Event',
                message: `Squirrel event was handled. Exiting...`
            });

            // Squirrel event handled and app will exit in 1000ms, so don't do anything else
            return;
        }

        // autoUpdater.autoDownload = true;
        // autoUpdater.allowPrerelease = true; // Include this only if you want pre-releases to be considered.
        // autoUpdater.autoInstallOnAppQuit = true;

        // // Check for updates
        // autoUpdater.checkForUpdatesAndNotify().catch(err => {
        //     console.error('Failed to check for updates:', err);
        // });

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
    // mainWindow.loadURL(isDev ? 'http://localhost:8080' : `file://${path.join(__dirname, '/vue-app/dist/index.html')}`);
    // mainWindow.loadURL(loggedin ? 'http://localhost:8080' : loginUri);

    console.log(amplifyUri, 'amplifyUri')
    mainWindow.loadURL(amplifyUri);

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
        dialog.showErrorBox('Welcome Back', `You arrived from 2: ${url}`);
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
        //  mainWindow.loadURL('http://localhost:3000/logout/?autopilot=true');
        mainWindow.loadURL('https://app.getspence.ai/logout/?autopilot=true');
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
    baseUrl: 'https://api.kindbuds.ai/',   //    'http://localhost:3003/',
    // spenceUrl: 'http://localhost:3010/spence/',
    spenceUrl: 'https://api.kindbuds.ai/bots/spence/', // import.meta.env.VITE_API_SPENCE_URL,
    api2Url: 'https://api.kindbuds.ai/bots/',
    //  api2Url: 'http://localhost:3009/',
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
