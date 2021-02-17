<h1 align="center">
  <br>
  <a href="https://aidoskuneen.com"><img src="https://aidoskuneen.com/wp-content/uploads/2020/08/cropped-adk-logo-footer-192x192.png" alt="Aidos Kuneen"></a>
  <br>
  Aidos Kuneen Wallet
  <br>
</h1>

<h5 align="center">This repository contains the desktop wallet for Aidos Kuneen.</h6>

<p align="center">
  <a href="https://travis-ci.org/AidosKuneen/aidos-wallet">
    <img src="https://api.travis-ci.org/AidosKuneen/aidos-wallet.svg?branch=master"
         alt="Travis">
  </a>
  <a href="https://ci.appveyor.com/project/MYehia565/aidos-wallet"><img src="https://ci.appveyor.com/api/projects/status/rnxy5ns9muenbbp5?svg=true" alt="Appveyor"></a>
  <a href="https://raw.githubusercontent.com/AidosKuneen/aidos-wallet/master/LICENSE">
      <img src="https://img.shields.io/badge/license-GPLv3-blue.svg" alt="License">
  </a>
</p>

## Requirements

1. Operating System
   - Linux 64 bit (32bit not supported)
   - Windows 64bit and 32bit
   - MacOS 64bit (32bit not supported)
2. [NodeJS](https://nodejs.org/en/download/)

NodeJS is required to install and run the app.

### For Windows Users

```
npm install -g --production windows-build-tools
```

This needs to be run in a cmd window with elevated rights (Administrator).

If you want to package the wallet you will need:

1. [Electron Builder](https://github.com/electron-userland/electron-builder)

2. Optionally [Docker](https://www.docker.com/) (In case you want to build for other platforms on Windows)

## Install

These instructions are only in case you want to build the wallet by yourself. Pre-built packages are available on [Release Page](https://github.com/AidosKuneen/aidos-wallet/releases).

1. Clone this repository:

```
git clone https://github.com/AidosKuneen/aidos-wallet
```

2. Install components:

```
yarn install
```

3. Run the app:

```
yarn start
```

4. If you wish to compile the app:

```
yarn compile
```

If you'd like to create a package only for a specific OS, you can do so by running:

```
yarn compile:win
yarn compile:mac
yarn compile:lin
```

You need the specific OS for each package (i.e. cannot cross compile).

5.  After that you can find the compiled binaries in the `out` dir.

## [Changelog](https://github.com/AidosKuneen/aidos-wallet/blob/master/changelog.md)

## LICENSE

[GNU General Public License v3.0](https://github.com/AidosKuneen/aidos-wallet/blob/master/LICENSE)
