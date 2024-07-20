const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'out', 'make', 'squirrel.windows', 'x64', 'latest.yml');
const destDir = path.join(__dirname, '..', 'dist', 'windows', 'squirrel.windows', 'x64');
const dest = path.join(destDir, 'latest.yml');

fs.mkdirSync(destDir, { recursive: true });

fs.copyFile(src, dest, (err) => {
    if (err) {
        console.error(`Failed to copy latest.yml: ${err}`);
        process.exit(1);
    } else {
        console.log('latest.yml copied successfully.');
    }
});
