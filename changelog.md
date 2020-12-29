# Changelog

## v2.1.0 - 2020-12-29

New Features

### Added

- Pin Code
- Notification
- Lock Screen
- Deposit Page
  - Used and unused address
- Transaction Page
  - Pagination
  - Search
  - Sort by date
- Settings page
  - Change pin code
  - Edit node configuration
- Code Signing Certificate for Windows and MacOS

## v2.0.1 - 2020-10-20

### Fixed

- Fixed CCurl that cause blank screen for production

## v2.0.0 - 2020-10-18

This is a major release featuring new design of the Aidos Kuneen Wallet.

### Added

- Form validation for better user experience.
- Dependencies
  - tailwindcss
  - autoprefixer
  - cssnano
  - postcss
  - toastify
  - modal

### Changed

- Login
  - New login screen
- Register
  - New register screen instead of modal.
- Wallet
  - Will show the balance, explorer, and latest transactions.
- Withdraw (Send)
  - There is now a progress bar while waiting for the transaction to finish.
  - Confirmation page after transaction is finish.
- Deposit (Received)
- Transaction
  - Transaction are now categorized by all transactions, sent, and receive.
  - Transaction will now show the transaction hash instead of the address.
  - View bundle has a new modal that shows the bundle status, bundle hash, input, and output.
  - Remove Broadcast ADK.
- FAQ
  - New FAQ screen instead of modal
- Explorer
  - A new feature where you can quickly search for the address balance, transaction status and amount, and bundle status.
  - There is a More details link which will take you to explorer.aidoskuneen.com for more information.
- App State
  - Every 2 mins (previously 1) it will update the transactions and balance.
- Node Version to v12+
- Require different api from electron instead of const electron = require("electron")
- Enabled [webPreference](https://www.electronjs.org/docs/api/browser-window) in BrowserWindow:
  - Preload index.js
  - webviewTag is set to true
  - enableRemoteModule is set to true
  - nodeIntegration is set to true
- [getWebContents](https://www.electronjs.org/docs/breaking-changes#removed-webviewgetwebcontents) is deprecated and replaced it with the new api
- Replace ffi to ffi-napi
- Replace ref to ref-napi

### Removed

- Fade transitions which causes lag.
- Bower
- Dependencies
  - UI Kit
  - Fontawesome
  - remodal
  - toastr
  - ui/js/components
  - ui/js/core
  - ui/css/components
