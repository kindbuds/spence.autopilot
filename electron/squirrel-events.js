const { app, dialog } = require('electron');
const path = require('path');
const ChildProcess = require('child_process');

function handleSquirrelEvent(application) {
    // if (process.argv.length === 1) {
    //     dialog.showMessageBox({
    //         type: 'info',
    //         title: 'Squirrel Event',
    //         message: 'No Squirrel event detected.'
    //     });
    //     return false;
    // }

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        try {
            let spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
            // spawnedProcess.on('error', (error) =>
            //     dialog.showMessageBox({
            //         type: 'error',
            //         title: 'Process Spawn Error',
            //         message: `Error spawning ${command}: ${error.message}`
            //     })
            // );
            return spawnedProcess;
        } catch (error) {
            // dialog.showMessageBox({
            //     type: 'error',
            //     title: 'Exception',
            //     message: `Exception spawning process: ${error.message}`
            // });
            return null;
        }
    };

    const squirrelEvent = process.argv[1];
    console.log(`Detected Squirrel event: ${squirrelEvent}`);

    if (squirrelEvent) {
        // dialog.showMessageBox({
        //     type: 'info',
        //     title: 'Squirrel Event Detected',
        //     message: `Detected Squirrel event: ${squirrelEvent}`
        // });
    } else {
        // dialog.showMessageBox({
        //     type: 'info',
        //     title: 'No Squirrel Event Detected',
        //     message: 'No Squirrel event detected. This might be a normal app start.'
        // });
    }

    // dialog.showMessageBox({
    //     type: 'info',
    //     title: 'Squirrel Details',
    //     message: `Update.exe path: ${updateDotExe}
    //     Executable Path: ${process.execPath}
    //     exeName: ${exeName}
    //     App Folder: ${appFolder}
    //     Root Atom Folder: ${rootAtomFolder}
    //     `,
    // });

    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            spawn(updateDotExe, ['--createShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            spawn(updateDotExe, ['--removeShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            application.quit();
            return true;

        default:
            // dialog.showMessageBox({
            //     type: 'warning',
            //     title: 'Unknown Squirrel Event',
            //     message: `Unknown Squirrel event: ${squirrelEvent}`
            // });
            return false;
    }
}

module.exports = { handleSquirrelEvent };
