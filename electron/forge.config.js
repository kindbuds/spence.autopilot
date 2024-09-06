// forge.config.js

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');
const { makeUniversalApp } = require('@electron/universal');

const p12Path = path.join(__dirname, 'developerID_application.p12');
const entitlementsPath = path.join(__dirname, "entitlements.plist");

function listDirectoryContentsRecursive(dirPath, level = 0) {
  let prefix = ' '.repeat(level * 2); // Indentation for nested directories
  console.log(`\n${prefix}Listing contents of: ${dirPath}`);

  try {
    let files = fs.readdirSync(dirPath); // Read directory contents
    if (files.length === 0) {
      console.log(`${prefix}(empty directory)`);
      return;
    }
    files.forEach(file => {
      let fullPath = path.join(dirPath, file);
      let stats = fs.lstatSync(fullPath); // Get file stats

      // Ignore specific directories
      if (file === 'node_modules' || file === '.git' || file === '.github' || file === 'vue-app') {
        console.log(`${prefix}${file}/ (ignored)`);
        return;
      }

      if (stats.isDirectory()) {
        console.log(`${prefix}${file}/ (directory)`);
        listDirectoryContentsRecursive(fullPath, level + 1); // Recurse into subdirectory
      } else {
        // Log files as well
        // console.log(`${prefix}${file} (file)`);
      }
    });
  } catch (err) {
    console.error(`${prefix}Error reading directory ${dirPath}: ${err.message}`);
  }
}

function listDirectoryContents(dirPath) {
  console.log(`\nListing contents of: ${dirPath}`);

  try {
    const files = fs.readdirSync(dirPath); // Read directory contents
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.lstatSync(fullPath); // Get file stats
      if (stats.isDirectory()) {
        console.log(`${file}/ (directory)`);
      } else {
        console.log(`${file}/ (file)`);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dirPath}: ${err.message}`);
  }
}


console.log(`Checking .p12 file at: ${p12Path}`);
fs.access(p12Path, fs.constants.F_OK, (err) => {
  if (err) {
    console.error(`.p12 file not found at: ${p12Path}`);
  } else {
    console.log(`.p12 file found at: ${p12Path}`);
  }
});

console.log(`Checking entitlements file at: ${entitlementsPath}`);
fs.access(entitlementsPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error(`Entitlements file not found at: ${entitlementsPath}`);
  } else {
    console.log(`Entitlements file found at: ${entitlementsPath}`);
  }
});


module.exports = {
  hooks: {
    prePackage: async (forgeConfig, platform, arch) => {
      console.log(`Packaging for ${platform} on ${arch}`);
    },
    postPackage: async (forgeConfig, buildPath) => {
      let rootDir = path.resolve(__dirname, '..');  // Use the project root
      let electronDir = path.join(rootDir, 'electron');
      let outDir = path.join(electronDir, 'out');
      let test1 = '/Users/runner/work/spence.autopilot'
      let test2 = '/Users/runner/work/spence.autopilot/spence.autopilot'

      console.log('> listing variable test1')
      listDirectoryContentsRecursive(test1);       // Root directory
      // console.log('> listing variable test2')
      // listDirectoryContentsRecursive(test2);       // Root directory
      // console.log('> listing variable rootDir')
      // listDirectoryContentsRecursive(rootDir);       // Root directory
      // console.log('> listing variable electronDir')
      // listDirectoryContentsRecursive(electronDir);   // Electron directory
      // console.log('> listing variable outDir')
      // listDirectoryContentsRecursive(outDir);

      // // outDir = outDir.replace('spence.autopilot/spence.autopilot', 'spence.autopilot')
      // console.log(`Running packageAfterCopy hook with outDir: ${outDir}`);
      // let x64Dir = path.join(outDir, 'Spence-AI-Career-Autopilot-darwin-x64');
      // let arm64Dir = path.join(outDir, 'Spence-AI-Career-Autopilot-darwin-arm64');
      // console.log(`x64Path: ${x64Dir}`);
      // console.log(`arm64Path: ${arm64Dir}`);



      // listDirectoryContents(outDir);
      // listDirectoryContents(x64Dir);
      // listDirectoryContents(arm64Dir);

      // const universalDir = path.join(outDir, 'Spence-AI-Career-Autopilot-darwin-universal');
      // console.log(`universalPath: ${universalDir}`);
      // listDirectoryContents(universalDir);

      // // Ensure both architecture builds exist
      // if (fs.existsSync(x64Dir) && fs.existsSync(arm64Dir)) {
      //   console.log('Combining x64 and arm64 builds into a Universal binary...');

      //   // Use @electron/universal to combine x64 and arm64 into a Universal binary
      //   await makeUniversalApp({
      //     x64AppPath: path.join(x64Dir, 'Spence-AI-Career-Autopilot.app'),
      //     arm64AppPath: path.join(arm64Dir, 'Spence-AI-Career-Autopilot.app'),
      //     outAppPath: path.join(universalPath, 'Spence-AI-Career-Autopilot.app'),
      //   });

      //   console.log('Universal binary created at:', universalPath);
      // } else {
      //   console.error('Could not find both x64 and arm64 builds to combine.');
      // }
    },
  },
  packagerConfig: {
    outDir: path.resolve(__dirname, 'electron/out'),
    // outDir: 'out/make',
    asar: true,
    icon: path.join(__dirname, "assets", "spence-face.ico"),
    extraResource: [
      path.join(__dirname, "assets", "spence-face.ico"),
      path.join(__dirname, "Info.plist"),
    ],
    ignore: [
      'node_modules/fs-xattr'
    ],
    osxSign: {},
    osxNotarize: false,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "Spence",
        description: 'Spence AI Career Autopilot',
        authors: "Jeff Borden",
        exe: "Spence-AI-Career-Autopilot.exe",
        setupExe: "Spence-Setup.exe",
        setupIcon: path.join(__dirname, 'assets', 'spence-face.ico'), // Path to your icon
        options: {
          icon: path.join(__dirname, 'assets', 'spence-face.ico'),
        }
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: "Spence",
        icon: path.join(__dirname, 'assets', 'spence-face.icns'), // Ensure you have an .icns icon for macOS
        overwrite: true,
        debug: false,
        format: 'ULFO'
      }
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'kindbuds',
          name: 'spence.autopilot'
        },
        prerelease: false, // Set to true if this is a pre-release
        draft: false, // Set to true if you want the release to be a draft
        tag: `v${require('./package.json').version}`, // Tag with the current version from package.json
        tokenRef: 'GITHUB_TOKEN' // The environment variable where your GitHub token is stored

      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  build: {
    appId: "ai.spence.autopilot",
    publish: [
      {
        provider: "github",
        owner: "kindbuds",
        repo: "spence.autopilot"
      }
    ],
    win: {
      target: ["squirrel"],
    },
    mac: {
      target: [
        {
          target: "dmg",
          arch: ["x64", "arm64"]
        }
      ]
    }
  }
}


