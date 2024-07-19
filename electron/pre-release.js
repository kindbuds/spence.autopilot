const { execSync } = require('child_process');
const { version } = require('./package.json');


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
            // Push changes to the remote repository
            execSync('git push origin main --follow-tags');
            console.log(`Changes committed and pushed with message: "Releasing v${version}"`);
        } else {
            console.log('No changes to commit.');
        }
    } catch (err) {
        console.error('Failed to commit and push changes:', err.message);
        process.exit(1);
    }
}