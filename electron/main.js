const { app, BrowserWindow, Menu, ipcMain, protocol, screen, shell, dialog } = require('electron');
// const { autoUpdater } = require('electron-updater');
const { build } = require('./package.json');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const storage = require('electron-json-storage');
const appData = app.getPath('appData');
const { AuthenticationClient } = require('auth0');
const os = require('os')

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// const vShared = require('./vue-app/src/helpers/shared.js')
const eShared = require('./helpers/shared.js')
// eShared.logtofile(`storage located @: ${path.join(appData, build.productName)}`);
storage.setDataPath(path.join(appData, build.productName));
const dotenv = require('dotenv');
// eShared.logtofile('Data will now be stored at:' + storage.getDataPath());

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    eShared.logtofile('.env file loaded');
} else {
    eShared.logtofile('No .env file found');
}


let loaderWindow, mainWindow, authWindow, userIp, userId, versionNumber;
const mainPlatform = os.platform() === 'win32' ? 'win' : os.platform() === 'darwin' ? 'mac' : 'other';
const isDev = process.env.NODE_ENV === 'development';
const amplifyUri = process.env.AMPLIFY_DOMAIN
const spenceDomain = process.env.SPENCE_DOMAIN
const sessionId = Date.now();

eShared.logtofile(`starting application2`)
eShared.logtofile(`process.env.NODE_ENV: ${process.env.NODE_ENV}`)
eShared.logtofile(`process.env.AMPLIFY_DOMAIN: ${process.env.AMPLIFY_DOMAIN}`)
eShared.logtofile(`process.env.SPENCE_DOMAIN: ${process.env.SPENCE_DOMAIN}`)
Object.keys(process.env).forEach(key => {
    eShared.logtofile(`${key}: ${process.env[key]}`);
});
if (require('electron-squirrel-startup')) return;


// Set up auto-updater
function setupAutoUpdater() {
    // Check for updates immediately on startup
    autoUpdater.checkForUpdatesAndNotify();

    // Event listeners for update progress
    autoUpdater.on('checking-for-update', () => {
        log.info('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        log.info('Update available.', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        log.info('Update not available.', info);
    });

    autoUpdater.on('error', (err) => {
        log.error('Error in auto-updater:', err);
    });

    autoUpdater.on('download-progress', (progress) => {
        log.info(
            `Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent}%`
        );
    });

    autoUpdater.on('update-downloaded', (info) => {
        log.info('Update downloaded; will install now');
        autoUpdater.quitAndInstall();
    });
}


// This makes sure the app is single-instance
const gotTheLock = app.requestSingleInstanceLock();
console.log(gotTheLock, 'gotTheLock')
// eShared.logtofile(`gotTheLock: ${gotTheLock}`)

versionNumber = app.getVersion();

if (!gotTheLock) {

    // eShared.logtofile(`Quitting application, instance already running.`)
    console.log("Quitting application, instance already running.");
    app.quit();
} else {

    if (!app.isPackaged) {
        log.info('Skipping update checks in development mode.');
    } else {
        setupAutoUpdater();
    }

    app.on('second-instance', async (event, commandLine, workingDirectory) => {
        // eShared.logtofile(`Command Line: ${JSON.stringify(commandLine)}`);
        // eShared.logtofile(`Second instance detected: ${commandLine}`);
        const protocolUrl = commandLine[commandLine.length - 1];
        // eShared.logtofile(`protocolUrl: ${protocolUrl}`);
        // eShared.logtofile(`loaderWindow: ${JSON.stringify(loaderWindow)}`);

        if (protocolUrl) {
            await handleAuthCallback(protocolUrl); // Modify this function to handle the protocol logic
        }
    });


    app.whenReady().then(async () => {
        console.log('running app.whenReady()')

        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('spence', process.execPath, [path.resolve(process.argv[1])]);
            }
        } else {
            app.setAsDefaultProtocolClient('spence');
        }
        // eShared.logtofile(`running app.whenReady()`)

        await createWindow();
        ipcMain.on('search-cycle-completed', async (event, dte) => {
            await eShared.setLastSearchCycleCompleted(dte);
        });

        async function loadUserData(userid) {
            //  eShared.logtofile(`loadUserData`)
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
            //  eShared.logtofile(`reload-user`)
            console.log('reload-user')
            const payload = {
                access_token: token,
                autopilot: true,
            };
            let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
            gptUser.token = token;


            // console.log(gptUser, 'gptUser')
            const userData = await loadUserData(gptUser.userid);
            gptUser.existing_jobs = userData.existing_jobs;
            gptUser.autopilot.usage = userData.usage;

            //  eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

            await eShared.setAuth(gptUser, eShared.logtofile);
            //  eShared.logtofile('User was successfully reloaded.');
            event.reply('reloadUserResponse', gptUser);
        });

        ipcMain.on('load-user', async (event) => {
            // eShared.logtofile(`load-user`)
            // try {

            let user = await eShared.loadUserData()
            // console.log(user, 'load-user')
            if (user) {
                const userData = await loadUserData(user.userid);
                user.existing_jobs = userData.existing_jobs;
                // console.log(userData, 'load-user.userData')
                event.reply('userDataResponse', user);
            }
            // } catch (error) {
            //     console.log(error, 'load-user error')
            // }
        });

        ipcMain.on('check-login-status', async (event) => {
            // eShared.logtofile(`check-login-status`)
            await createWindow(isLoggedIn);
        });
        ipcMain.on('setup-saved', async (event, setupData) => {
            // eShared.logtofile(`setup-saved`)
            console.log(setupData, 'Received setup-saved data');
            const newSetup = await sendToApi(`${api.api2Url}autopilot/setup`, setupData, 'json');
            console.log(newSetup, 'newSetup')

            if (typeof newSetup.is_remote === 'undefined'
                && typeof newSetup.is_hybrid === 'undefined'
                && typeof newSetup.is_onsite === 'undefined') {
                // first time setup
                newSetup.is_remote = true;
                newSetup.is_hybrid = false;
                newSetup.is_onsite = false;
                newSetup.location = "";
                newSetup.disable_salary = false;
                newSetup.negative_keywords = [];
                newSetup.company_filters = [];
            }

            let user = await eShared.loadUserData();
            if (!user.usage) {
                const usageData = await loadUserData(newSetup.userid);
                // console.log(usageData, 'usageData')
                user.usage = usageData.usage;
            }
            console.log(user, 'user')
            newSetup.usage = user.usage
            user.autopilot = newSetup
            await eShared.setAuth(user, eShared.logtofile);
            event.sender.send('setup-completed', newSetup);
        });

        ipcMain.on('save-settings', async (event, config) => {
            // eShared.logtofile(`main.save-settings`)
            console.log('main.save-settings', config);
            // let settingsSaved =
            await sendToApi(`${api.api2Url}autopilot/save_config`, config);
            // console.log(settingsSaved, 'settingsSaved');

            // let user = await eShared.loadUserData();
            // console.log(user, 'userData.save-settings')
            // config.usage = user.usage;
            // user.autopilot = config
            // await eShared.setAuth(user, eShared.logtofile);
        });
        ipcMain.handle('is-logged-in', async (event) => {
            // eShared.logtofile(`main.is-logged-in`)
            return await eShared.isLoggedIn();
        });
        ipcMain.handle('is-logged-in-setup', async (event) => {
            // eShared.logtofile(`main.is-logged-in-setup`)
            return await eShared.isLoggedInAndSetup();
        });

    });
}

let listenersAdded = false;

function addEventListeners() {
    if (listenersAdded) return; // Exit if listeners are already added
    listenersAdded = true;

    // mainWindow
    // mainWindow.webContents.on('did-finish-load', () => {
    //     console.log('did-finish-load-2')
    //     // eShared.logtofile(`did-finish-load`)
    //     if (mainWindow) mainWindow.webContents.executeJavaScript(`console.log('did-finish-load')`);
    //     addScroll();
    // });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('did-finish-load-1')
        //  eShared.logtofile(`did-finish-load`)
        if (!mainWindow) return;

        mainWindow.webContents.insertCSS('html, body { overflow: hidden !important; }');
        mainWindow.setTitle("Spence - AI Career Autopilot");
    });
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        // eShared.logtofile(`Failed to load content. Error: ${errorDescription}, URL: ${validatedURL}`)
        console.log(`Failed to load content. Error: ${errorDescription}, URL: ${validatedURL}`);
    });
    mainWindow.webContents.on('dom-ready', () => {
        // eShared.logtofile(`dom-ready`)
        console.log("DOM is ready");
        if (mainWindow)
            mainWindow.webContents.executeJavaScript(`console.log('DOM is ready')`);
        addScroll();
    });
    mainWindow.webContents.on('did-navigate', (event, url) => {
        // eShared.logtofile(`Navigated to: ${url}`)
        console.log('Navigated to:', url);
        if (mainWindow)
            mainWindow.webContents.executeJavaScript(`console.log('Navigated to:', '${url}');`);

    });
    mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
        // eShared.logtofile(`Navigated within page to: ${url}`)
        console.log('Navigated within page to:', url);
        if (mainWindow)
            mainWindow.webContents.executeJavaScript(`console.log('Navigated within page to:', '${url}');`);
        addScroll();
    });
    mainWindow.on('page-title-updated', (event) => {
        // eShared.logtofile(`page-title-updated`)
        event.preventDefault();
    });
    mainWindow.webContents.on('crashed', () => {
        // eShared.logtofile(`The web content has crashed`)
        console.error('The web content has crashed');
    });
    mainWindow.webContents.on('unresponsive', () => {
        // eShared.logtofile(`The web content is unresponsive`)
        console.error('The web content is unresponsive');
    });
    mainWindow.webContents.on('new-window', async (event, url, frameName, disposition, options, additionalFeatures) => {
        // eShared.logtofile(`mainWindow.webContents.on('new-window'`)
        console.log(` mainWindow.webContents.on('new-window'`)
        if (!mainWindow) return;

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
    mainWindow.on('closed', function () {
        // eShared.logtofile('mainWindow has been closed');
        console.log('mainWindow has been closed');
        mainWindow = null;
    });
    mainWindow.once('ready-to-show', () => {
        // eShared.logtofile(mainWindow.ready-to-show)

        mainWindow.show();
        try {
            if (isDev) {
                setTimeout(() => {

                    if (mainWindow) {
                        console.log('openDevTools');
                        mainWindow.openDevTools();
                        mainWindow.webContents.openDevTools();
                    }
                }, 1000);
            }
        } catch {
            console.log('openDevTools failed')
        }
    });

    // ipcMain
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
    ipcMain.handle('get-work-area-size', async () => {
        const { width: workAreaWidth, height: workAreaHeight } = screen.getPrimaryDisplay().workAreaSize;
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().size;

        // Get the current window size
        const [windowWidth, windowHeight] = mainWindow.getSize();

        // Return both the window size and work area size
        return {
            windowSize: { width: windowWidth, height: windowHeight },
            workAreaSize: { width: workAreaWidth, height: workAreaHeight },
            screenSize: { width: screenWidth, height: screenHeight },
        };
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

            return jobContent;
        } catch (error) {
            console.error('Error fetching job content:', error);
            throw error;
        }
    });
    ipcMain.on('add-negative-keyword', async (event, keyword) => {
        console.log('in ipcMain.add-negative-keyword')
        const user = await eShared.loadUserData();
        const payload = {
            userid: user.userid,
            keyword,
        }
        await sendToApi(`${api.api2Url}autopilot/negative_kw`, payload);
    });
    ipcMain.on('add-company-filter', async (event, companyFilter) => {
        console.log('in ipcMain.add-company-filter')
        const user = await eShared.loadUserData();
        const payload = {
            userid: user.userid,
            companyFilter,
        }
        await sendToApi(`${api.api2Url}autopilot/company_filter`, payload);
    });
    ipcMain.on('job-discovered', (event, arg) => {
        // console.log(arg, 'in main.js.job-discovered')
        if (!mainWindow) return;
        mainWindow.webContents.send('new-job', arg);
    });
    ipcMain.on('authenticate-linkedin', (event, arg) => {
        mainWindow.show();
    });
}

const addScroll = () => {
    if (!mainWindow) return;

    mainWindow.webContents.executeJavaScript(`console.log('addScroll');`);

    const currentURL = mainWindow.webContents.getURL();
    console.log("Web content loaded", currentURL);
    mainWindow.webContents.executeJavaScript(`console.log('Web content loaded ${currentURL}');`);
    eShared.logtofile(`Web content loaded ${currentURL}`)
    const scrolls = ['auth0', 'get-started']
    if (scrolls.some(sc => currentURL.includes(sc))) {
        // Inject CSS to enforce scrolling

        let element = mainPlatform === 'mac' ? 'body' : 'html';

        if (currentURL.includes('auth0')) {
            element = 'body';
        }

        setTimeout(() => {
            mainWindow.webContents.insertCSS(`
            ${element} {
                overflow-y: scroll !important;
            }
        `);

            console.log("Injected CSS for scrolling.");
            eShared.logtofile(`Injected CSS for scrolling.`)
        }, 1000);
    }

}

async function createWindow(loggedin = null) {
    // eShared.logtofile(`running createWindow`)
    console.log('start createWindow')
    if (!loggedin) {
        try {
            const userData = await eShared.loadUserData();
            loggedin = !!userData && !!userData.token && !!userData.userid;
            if (loggedin) {
                userId = userData.userid
                await sendEventToGA4('user_session_start', { userId: userId, session_id: sessionId }, null);
            }
        } catch (error) {

        }
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
            // nodeIntegration: false,
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js'),
            nativeWindowOpen: true,
        }
    });
    addEventListeners();

    console.log("Window created");
    mainWindow.webContents.executeJavaScript(`console.log('Window created: version ${versionNumber} on ${mainPlatform}')`);

    console.log(isDev, process.env.NODE_ENV, 'isDev')
    mainWindow.maximize();

    console.log(amplifyUri, 'amplifyUri')
    userIp = await getUserIpAddress();

    mainWindow.loadURL(amplifyUri);
    // eShared.logtofile(`called mainWindow.loadURL ${amplifyUri}`)

    // Log URL changes

    Menu.setApplicationMenu(null);
}


async function handleAuthCallback(fullUrl) {
    eShared.logtofile(`handleAuthCallback: ${fullUrl}`)

    const urlObject = new URL(fullUrl);
    const token = urlObject.searchParams.get('token');
    const userid = urlObject.searchParams.get('id');
    // store.set('auth', { token, userid });
    // shared.logtofile(`Stored auth: ${JSON.stringify(store.get('auth'))}`);
    //    console.log('Received code:', code);
    // eShared.logtofile(`in handleAuthCallback`)
    // eShared.logtofile(`urlObject: ${JSON.stringify(urlObject)}`)
    // eShared.logtofile(`Received token: ${token}`);

    // console.log(fullUrl, 'fullUrl')
    // eShared.logtofile(`fullUrl: ${fullUrl}`);

    const payload = {
        access_token: token,
        autopilot: true,
    }
    try {
        let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
        gptUser.token = token;

        // eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

        await eShared.setAuth(gptUser, eShared.logtofile);
        // eShared.logtofile('Auth data was successfully saved.');
    } catch (error) {
        console.log(error, 'Authentication error')
        // eShared.logtofile('Error during authentication process: ' + JSON.stringify(error));
    }

    await createWindow(true);
    // Replace 'protocol-action' with the actual IPC message you want to use

}



// // Load user data when the extension starts


app.on('will-finish-launching', () => {
    // eShared.logtofile(`will-finish-launching`)

    app.on('open-url', (event, url) => {
        // eShared.logtofile(`open-url`)
        event.preventDefault();
        // dialog.showErrorBox('Welcome Back', `You arrived from 2: ${url}`);
        // Additional handling code...
    });
});


app.on('window-all-closed', () => {
    // eShared.logtofile(`in window-all-closed`)
    console.log('in window-all-closed')
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
    // eShared.logtofile(`activate`)
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
});

async function getUserIpAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip; // Returns the user's IP address
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}
async function sendEventToGA4(eventName, params, userAgent) {
    const clientId = userId ? userId : params.userId; // Implement this function as needed

    if (params.userId)
        delete params.userId;

    params.app_name = 'Spence AI Career Autopilot';
    params.app_version = versionNumber,

        console.log(params, 'params')

    const eventData = {
        client_id: clientId,
        events: [
            {
                name: eventName,
                params: params || {},
            },
        ]
    };

    console.log(JSON.stringify(eventData), 'sendEventToGA4')
    const MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
    const API_SECRET = process.env.GA_API_SECRET;
    const ipOverride = userIp ? `&ip_override=${userIp}` : ``;
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;
    console.log(url, 'url')
    try {
        const response = await sendToApi(url, eventData, 'text', { 'User-Agent': userAgent });
        console.log('Event sent to GA4:', response);
    } catch (error) {
        console.error('Error sending event to GA4:', error);
    }
}

ipcMain.on('ga4-event', async (event, data) => {
    const { eventName, params, userAgent } = data;
    // console.log(data, userId, params.userId, 'ga4-event')
    await sendEventToGA4(eventName, params, userAgent);
});

ipcMain.on('job-details', (event, jobDetails) => {
    console.log('Received job details:', jobDetails);
    // Process jobDetails as needed, e.g., send them to your Vue component
    if (mainWindow)
        mainWindow.webContents.send('job-details', jobDetails); // assuming `mainWindow` is your primary BrowserWindow
});

ipcMain.handle('get-app-path', () => {
    // eShared.logtofile(`get-app-path`)
    return app.getAppPath();
});

ipcMain.handle('get-dirname', async (event) => {
    // eShared.logtofile(`get-dirname`)
    return __dirname;
});

ipcMain.on('variable-request', function (event, arg) {
    event.sender.send('variable-reply', [__dirname]);
});

ipcMain.on('logout', async (event) => {
    storage.remove('auth', async (error) => {
        if (error) throw error;
        console.log('User logged out, auth data removed.');

        console.log('LOGGED OUT!')
        // mainWindow.loadURL(amplifyUri);
        // createLoaderWindow();
    });
})

ipcMain.on('auth-callback', async (event, { token, userid }) => {
    // eShared.logtofile(`Received token: ${token}`);
    // eShared.logtofile(`Received userid: ${userid}`);

    const payload = {
        access_token: token,
        autopilot: true,
    };
    let gptUser = await sendToApi(`${api.spenceUrl}gpt/gpt_user`, payload, 'json');
    gptUser.token = token;

    // eShared.logtofile(`gptUser: ${JSON.stringify(gptUser)}`);

    eShared.setAuth(gptUser, eShared.logtofile)
        .then(() => {
            mainWindow.loadURL(amplifyUri);
        })
        .catch(error => {
        });

    await createWindow(true);
});

ipcMain.handle('create-checkout', async (event, payload) => {
    console.log(JSON.stringify(payload), 'create-checkout.args')
    let checkoutResponse = await sendToApi(`${api.api2Url}autopilot/create_checkout`,
        payload, 'json');

    if (checkoutResponse && checkoutResponse.body) {
        checkoutResponse = JSON.parse(checkoutResponse.body)
    }
    console.log(checkoutResponse, `checkoutResponse`)
    return checkoutResponse;
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
    jobData.os = mainPlatform;

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

const sendToApi = async (url, data, response_type = 'text', additionalHeaders = {}) => {
    // eShared.logtofile(`sendToApi: ${url} ${JSON.stringify(data)}`);
    try {
        // Merge default headers with additional headers
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders,
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let response_data;

        // console.log(response, 'sendToApi.response')

        switch (response_type) {
            case 'text':
                response_data = await response.text();
                break;
            case 'json':
                response_data = await response.json();
                break;
            default:
                response_data = await response.arrayBuffer();
                break;
        }

        // eShared.logtofile(`response_data: ${JSON.stringify(response_data)}`)
        return response_data;
    } catch (error) {
        // console.error('Error:', error);
        throw error; // Propagate the error to the caller
    }
};
