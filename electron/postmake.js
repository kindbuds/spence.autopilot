const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'out', 'make', 'squirrel.windows', 'x64', 'latest.yml');
const destDir = path.join(__dirname, 'dist', 'windows', 'squirrel.windows', 'x64');
const dest = path.join(destDir, 'latest.yml');

// Ensure the directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Check if latest.yml exists before attempting to copy
if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Successfully copied latest.yml to dist directory.');
} else {
    console.log('latest.yml does not exist, skipping copy.');
}