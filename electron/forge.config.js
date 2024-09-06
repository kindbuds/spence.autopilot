// forge.config.js

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');
const { makeUniversalApp } = require('@electron/universal');

const p12Path = path.join(__dirname, 'developerID_application.p12');
const entitlementsPath = path.join(__dirname, "entitlements.plist");


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
    packageAfterCopy: async (forgeConfig, buildPath) => {
      console.log(`Running packageAfterCopy hook with buildPath: ${buildPath}`);

      const x64Path = path.join(buildPath, '../Spence-AI-Career-Autopilot-darwin-x64');
      const arm64Path = path.join(buildPath, '../Spence-AI-Career-Autopilot-darwin-arm64');
      const universalPath = path.join(buildPath, '../Spence-AI-Career-Autopilot-darwin-universal');

      // List everything in buildPath to help debug the current directory contents
      console.log('Listing contents of buildPath:');
      const files = fs.readdirSync(buildPath);
      files.forEach(file => {
        console.log(file);
      });

      console.log(`x64Path: ${x64Path}`);
      console.log(`arm64Path: ${arm64Path}`);
      console.log(`universalPath: ${universalPath}`);

      // Ensure both architecture builds exist
      if (fs.existsSync(x64Path) && fs.existsSync(arm64Path)) {
        console.log('Combining x64 and arm64 builds into a Universal binary...');

        // Use @electron/universal to combine x64 and arm64 into a Universal binary
        await makeUniversalApp({
          x64AppPath: path.join(x64Path, 'Spence-AI-Career-Autopilot.app'),
          arm64AppPath: path.join(arm64Path, 'Spence-AI-Career-Autopilot.app'),
          outAppPath: path.join(universalPath, 'Spence-AI-Career-Autopilot.app'),
        });

        console.log('Universal binary created at:', universalPath);
      } else {
        console.error('Could not find both x64 and arm64 builds to combine.');
      }
    },
  },
  packagerConfig: {
    outDir: 'out/make',
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


