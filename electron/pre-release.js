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
    // Check if tag already exists
    const existingTags = execSync('git tag').toString().split('\n');
    if (existingTags.includes(`v${version}`)) {
        console.log(`Tag v${version} already exists. Skipping tag creation.`);
    } else {
        // Tag the new version
        execSync(`git tag v${version}`);
        console.log(`Tag v${version} created.`);
    }

    // Push changes and tags
    execSync('git push origin main --tags');
    console.log('Changes and tags pushed to origin.');

} catch (err) {
    console.error('Failed to push changes and tags:', err.message);
    process.exit(1);
}
