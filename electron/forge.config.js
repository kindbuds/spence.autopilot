const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, "assets", "spence-face.ico"),
    extraResource: [
      path.join(__dirname, "assets", "spence-face.ico"),
    ],
    ignore: [
      'node_modules/fs-xattr'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: "Spence",
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
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    // Add the DMG maker for macOS
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: "Spence",
        icon: path.join(__dirname, 'assets', 'spence-face.icns'), // Ensure you have an .icns icon for macOS
        overwrite: true,
        debug: false,
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
        draft: true,
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
};
