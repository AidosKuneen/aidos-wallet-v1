[![Build Status](https://travis-ci.org/AidosKuneen/aidos-wallet.svg?branch=master)](https://travis-ci.org/AidosKuneen/aidos-wallet)
[![Build status](https://ci.appveyor.com/api/projects/status/0b42t20u4wfv2qau?svg=true)](https://ci.appveyor.com/project/ogami-daigoro/aidos-wallet)
[![GitHub license](https://img.shields.io/badge/license-GPLv3-blue.svg)](https://raw.githubusercontent.com/AidosKuneen/aidos-wallet/master/LICENSE)


# Aidos Wallet

## Overview

This repository contains the desktop wallet for AidosKuneen.

## OS

* Linux 64 bit
* Windows 64bit and 32bit
* MacOS 64bit

## Install

These instructions are only in case you want to build the wallet by yourself. Pre-built packages are available on [Release Page](https://github.com/AidosKuneen/aidos-wallet/releases).

## Requirements

1. [NodeJS](https://nodejs.org/en/download/)

NodeJS is required to install and run the app.

2. [Electron](http://electron.atom.io):

You can use the package manager if you are using Linux.
On Windows or if you want to install manually please use:

  ```
  npm install -g electron-prebuilt
  ```

3. [Bower](https://bower.io/):

  ```
  npm install -g bower
  ```

### For Windows Users

  ```
  npm install -g --production windows-build-tools
  ```

This needs to be run in a cmd window with elevated rights (Administrator).


If you want to package the wallet you will need:

1. [Electron Builder](https://github.com/electron-userland/electron-builder)
  
  ```
  npm install -g electron-builder
  ```

2. Optionally [Docker](https://www.docker.com) (In case you want to build for other platforms on Windows) 

## Install

1. Clone this repository:

  ```
  git clone https://github.com/AidosKuneen/aidos-wallet
  ```
  
2. Install components:

  ```
  npm install
  ```

3. Run the app:

  ```
  npm start
  ```

4. If you wish to compile the app: 

  ```
  npm run compile
  ```

  If you'd like to create a package only for a specific OS, you can do so by running: 

  ```
  npm run compile:win
  npm run compile:mac
  npm run compile:lin
  ```

  You need the specific OS for each package (i.e. cannot cross compile).

 5. After that you can find the compiled binaries in the `out` dir.
 
## Testnet

To use the Wallet for the Testnet, rename package.testnet.json to package.json and follow the above instructions to create a runnable version. Make sure you are connecting to a Server that uses the ARI Testnet. (Otherwise your connection will be refused as the Test- and Mainnet use different API ports)
 
## LICENSE

[GNU General Public License v3.0](https://github.com/AidosKuneen/aidos-wallet/blob/master/LICENSE)
