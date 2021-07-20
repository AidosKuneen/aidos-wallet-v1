<h1 align="center">
  <br>
  <a href="https://aidoskuneen.com"><img src="https://aidoskuneen.com/wp-content/uploads/2020/08/cropped-adk-logo-footer-192x192.png" alt="Aidos Kuneen"></a>
  <br>
  Aidos Kuneen Wallet (<b>incl. Support for SmartData Transactions<b>)
  <br>
</h1>

<h5 align="center">This repository has been forked from AidosKuneen/aidos-wallet by ADKMASTER.</h5>

<p align="center">
This Fork is used by ADKMASTER in order to develop and add additional features, which will be published back to AidosKuneen/aidos-wallet as pull requests.
</p>

## Prebuilt binaries

If you want to just use the wallet app with Smart Data functionality, please download (https://github.com/adkmaster/aidos-wallet/releases/download/2.1.2/ADK.Wallet.Setup.2.1.2.SD.exe)

For every version there are two options: default (mainnet) build and testnet build. You probably need default one, for
the mainnet. **Testnet builds should be used only for interacting with the test network of Aidos Kuneen!**

## Requirements

1. Operating System
   - Linux 64 bit (32bit not supported)
   - Windows 64bit and 32bit
   - MacOS 64bit (32bit not supported)
2. [NodeJS](https://nodejs.org/en/download/)

NodeJS is required to install and run the app.

### For Windows Users

```
yarn install -g --production windows-build-tools
```

This needs to be run in a cmd window with elevated rights (Administrator).

If you want to package the wallet you will need:

1. [Electron Builder](https://github.com/electron-userland/electron-builder)

2. Optionally [Docker](https://www.docker.com/) (In case you want to build for other platforms on Windows)

## Build & Run

These instructions are only in case you want to build the wallet by yourself. Pre-built packages are available on [Release Page](https://github.com/adkmaster/aidos-wallet/releases).

1. Clone this repository:

```
git clone https://github.com/adkmaster/aidos-wallet
```

2. Install dependencies:

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

## [Changelog](https://github.com/adkmaster/aidos-wallet/blob/master/changelog.md)

## LICENSE

[GNU General Public License v3.0](https://github.com/AidosKuneen/aidos-wallet/blob/master/LICENSE)
