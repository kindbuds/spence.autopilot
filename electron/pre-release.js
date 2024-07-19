const { execSync } = require('child_process');
const { version } = require('./package.json');
const path = require('path');

try {
    // Check for uncommitted changes
    execSync('git diff-index --quiet HEAD');
    console.log('No uncommitted changes found.');
} catch {
    try {
        // Stage all changes
        execSync('git add .');
        // Check if there are staged changes
        const stagedChanges = execSync('git diff --cached --name-only').toString().trim();
        if (stagedChanges) {
            // Commit changes with the current version in the message
            execSync(`git commit -m "Releasing v${version}"`);
            console.log(`Changes committed with message: "Releasing v${version}"`);
        } else {
            console.log('No changes to commit.');
        }
    } catch (err) {
        console.error('Failed to commit changes:', err.message);
        process.exit(1);
    }
}

try {
    // Run the postcommit.bat script
    const postCommitScript = path.resolve(__dirname, 'postcommit.bat');
    execSync(postCommitScript, { stdio: 'inherit' });
} catch (err) {
    console.error('Failed to run postcommit.bat:', err.message);
    process.exit(1);
}