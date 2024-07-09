const fs = require('fs');
const path = require('path');
const storage = require('electron-json-storage');

module.exports.logtofile = (message) => {
    // const logFile = path.join(__dirname, 'log.txt');
    // const timestamp = new Date().toISOString();
    // fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

module.exports.getGuid = () => {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

// Function to check if the user is authenticated
module.exports.isLoggedIn = async (userData) => {
    try {
        const authData = userData || await exports.loadUserData();
        return !!authData && !!authData.token && !!authData.userid;
    } catch (e) {
        return false;
    }
}
module.exports.isLoggedInAndSetup = async (userData) => {
    try {
        const authData = userData || await exports.loadUserData();
        //   console.log(authData, 'isLoggedInAndSetup.authData')
        return !!authData && !!authData.token && !!authData.userid && !!authData.autopilot;
    } catch (e) {
        return false;
    }
}


module.exports.setLastSearchCycleCompleted = (dte) => {
    return new Promise((resolve, reject) => {
        storage.set('lastSearchCycleCompleted', dte, function (error) {
            if (error) {
                exports.logtofile(`Error saving last search cycle: ${error}`);
                reject(error); // Reject the promise on error
            } else {
                exports.logtofile('Last search cycle saved successfully.');
                resolve(true); // Resolve the promise indicating success
            }
        });
    });
}

module.exports.getLastSearchCycleCompleted = () => {
    return new Promise((resolve, reject) => {
        storage.get('lastSearchCycleCompleted', (error, data) => {
            if (error) {
                // exports.logtofile(`Error retrieving auth data: ${error}`);
                reject(error); // Reject the promise on error
            }

            if (!data) {
                console.log('last searchCycle not found.');
                reject('Auth data not found.');  // Resolve as false if no auth data is found
            }

            if (typeof data == 'string' || typeof data == 'number') {
                data = new Date(data);
            }

            resolve(data); // Resolve with the login status
        });
    });
}

module.exports.setAuth = (authData) => {
    return new Promise((resolve, reject) => {
        storage.set('auth', authData, function (error) {
            if (error) {
                exports.logtofile(`Error saving auth data: ${error}`);
                reject(error); // Reject the promise on error
            } else {
                exports.logtofile('Auth data saved successfully.');
                resolve(true); // Resolve the promise indicating success
            }
        });
    });
}

module.exports.loadUserData = async () => {
    return new Promise((resolve, reject) => {
        storage.get('auth', async (error, data) => {
            if (error) {
                // exports.logtofile(`Error retrieving auth data: ${error}`);
                reject(error); // Reject the promise on error
            }

            if (!data) {
                console.log('Auth data not found.');
                reject('Auth data not found.');  // Resolve as false if no auth data is found
            }

            if (typeof data == 'string') {
                data = JSON.parse(data);
            }

            if (Object.keys(data).length === 0) {
                console.log('Auth data not found.');
                reject('Auth data not found.'); // Resolve as false if no auth data is found
            }

            try {
                const lastSearchCycle = await module.exports.getLastSearchCycleCompleted();
                console.log(lastSearchCycle, 'lastSearchCycle')
                data.last_search_cycle = lastSearchCycle;
            } catch (e) {
                console.log('Error retrieving last search cycle:', e);
                data.last_search_cycle = null; // or handle the error as needed
            }

            resolve(data); // Resolve with the login status
        });
    });
}
