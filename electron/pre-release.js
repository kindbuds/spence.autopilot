const { execSync } = require('child_process');
const { version } = require('./package.json');

try {
    // Check for uncommitted changes
    execSync('git diff-index --quiet HEAD');
} catch {
    // Stage all changes
    execSync('git add .');
    // Commit changes with the current version in the message
    execSync(`git commit -m "Releasing v${version}"`);
    // Push changes to the remote repository
    execSync('git push origin main');
}