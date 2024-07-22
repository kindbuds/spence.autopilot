const { app, dialog } = require('electron');
const path = require('path');
const ChildProcess = require('child_process');

function handleSquirrelEvent(application) {
    if (process.argv.length === 1) {
        dialog.showMessageBox({
            type: 'info',
            title: 'Squirrel Event',
            message: 'No Squirrel event detected.'
        });
        return false;
    }

    const updateDotExe = path.resolve(path.join(path.resolve(process.execPath, '..'), '..', 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        try {
            let spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
            spawnedProcess.on('error', (error) =>
                dialog.showMessageBox({
                    type: 'error',
                    title: 'Process Spawn Error',
                    message: `Error spawning ${command}: ${error.message}`
                })
            );
            return spawnedProcess;
        } catch (error) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Exception',
                message: `Exception spawning process: ${error.message}`
            });
            return null;
        }
    };

    const squirrelEvent = process.argv[1];
    dialog.showMessageBox({
        type: 'info',
        title: 'Squirrel Event',
        message: `Handling Squirrel event: ${squirrelEvent}`
    });

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
            dialog.showMessageBox({
                type: 'warning',
                title: 'Unknown Squirrel Event',
                message: `Unknown Squirrel event: ${squirrelEvent}`
            });
            return false;
    }
}

module.exports = { handleSquirrelEvent };
