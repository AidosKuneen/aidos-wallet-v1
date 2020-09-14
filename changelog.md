# ADK Wallet

### Changelog (v1.3.0)

- Upgade all dependencies:
  - electron 1.8.8 to 10.1.1
  - electron-builder 22.8.0
  - rimraf 2.5.4 to 3.0.2
  - fsextra 1.0.0 to 9.0.1
  - Replace ffi to ffi-napi
  - Replace ref to ref-napi
  - glob 7.1.1 to 7.1.6
  - pidusage 1.1.0 to 2.0.21
  - tingle 0.7.0 to 0.15.3
  - clipboard 1.5.10 to 2.0.6
  - fontawesome 4.6.3 to 4.7.0
  - remodal 1.0.7 to 1.1.1
  - async 2.1.4 to 3.2.0
  - jquery 2.2.4 to 3.5.1
- Required node version is v12+
- Remove Bower and replace it to Yarn
- Created modules folder for other dependencies that are required
- Require different api from electron instead of const electron = require("electron")
- Enabled [webPreference](https://www.electronjs.org/docs/api/browser-window) in BrowserWindow:
  - Preload index.js
  - webviewTag is set to true
  - enableRemoteModule is set to true
  - nodeIntegration is set to true
- [getWebContents](https://www.electronjs.org/docs/breaking-changes#removed-webviewgetwebcontents) is deprecated and replaced it with the new api
- Update application icon
