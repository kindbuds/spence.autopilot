// forge.config.js

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

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
    packageAfterCopy: async (forgeConfig, build_path) => {
      console.log(`\nBuild Path: ${build_path}`);
      // await minify(build_path + '/src');
    },
  },
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, "assets", "spence-face.ico"),
    extraResource: [
      path.join(__dirname, "assets", "spence-face.ico"),
    ],
    ignore: [
      'node_modules/fs-xattr'
    ],
    osxSign: {
      identity: "Developer ID Application: Kind Buds, LLC (SRJJDF6WDH)", // Replace with your actual identity
      hardenedRuntime: true,
      entitlements: entitlementsPath, // Path to your entitlements file
      entitlementsInherit: entitlementsPath, // Path to your entitlements file
      gatekeeperAssess: false,
      'gatekeeper-assess': false,
      'deep': true,
      'keychain': 'login.keychain-db'
      // 'keychain-profile': p12Path // Path to your p12 file
    },
    osxNotarize: {
      appleId: "jeff.borden@kindbuds.us", // Replace with your Apple ID
      appleIdPassword: "lhua-eecg-lvgg-tshh" // Replace with your app-specific password
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "Spence",
        description: 'Spence AI Career Autopilot',
        authors: "Jeff Borden",
        exe: "Spence AI Career Autopilot.exe",
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
      },
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
    }
  }
}
