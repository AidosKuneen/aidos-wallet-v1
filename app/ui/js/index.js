// const { ipcRenderer } = require("electron");

// Get Today Date
function getTodayDate() {
  const options = { day: "numeric", month: "short" };
  const now = new Intl.DateTimeFormat(undefined, options).format(new Date());

  const today = document.querySelectorAll("span#today");

  today.forEach(function (todayItem) {
    todayItem.innerHTML = now;
  });
}

// Transaction Tab
function openTab() {
  const tabs = document.querySelectorAll(".tab-btn");
  // const tabsContent = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      removeActiveTab();
      addActiveTab(tab);
    });
  });

  const removeActiveTab = () => {
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });
    // tabsContent.forEach((tabContent) => {
    //   tabContent.classList.remove("active");
    // });
  };

  const addActiveTab = (tab) => {
    tab.classList.add("active");
    const tabId = tab.getAttribute("href");
    // const getTab = document.querySelector(tabId);
    // getTab.classList.add("active");
  };
}

// FAQ
function detailAsAccrdn() {
  const details = document.querySelectorAll("details");
  details.forEach((targetDetail) => {
    targetDetail.addEventListener("click", () => {
      details.forEach((detail) => {
        if (detail !== targetDetail) {
          detail.removeAttribute("open");
        }
      });
    });
  });
}

// Fetch data for the explorer
function fetchData() {
  //Explorer
  const explorer = document.getElementById("explorer");
  const expAddress = document.getElementById("explorer-address");
  const expTransaction = document.getElementById("explorer-transaction");
  const expBundle = document.getElementById("explorer-bundle");
  let expInputValue = document.getElementById("explorer-input");
  const expForm = document.querySelector(".explorer-form");
  const clearBtn = document.getElementById("btn-clear");
  let expRadioValue = "address";

  //Status
  const status = document.getElementById("status");
  const details = document.getElementById("status-details");
  const statusImg = details.querySelector("img");
  const statusText = details.querySelector(".status-text");
  const subStatus = details.querySelector(".sub-status");
  const statusAmount = document.querySelector(".status-amount");
  const amount = statusAmount.querySelector("span");
  const statusLink = document.querySelector(".status-link");
  const backBtn = document.getElementById("back-btn");
  const spinner = document.querySelector(".spinner");

  let API_URL;
  function callAPI() {
    API_URL = `https://explorer.aidoskuneen.com/api/${expRadioValue}?hash=${expInputValue.value}`;

    // console.log(API_URL);
  }

  function returnError() {
    spinner.classList.add("hidden");
    status.classList.remove("hidden");
    statusImg.src = "#";
    statusText.innerHTML = "Transaction not found";
    statusAmount.classList.add("hidden");
  }

  function fetchAPI() {
    spinner.classList.remove("hidden");
    if (expAddress.checked) {
      fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
          spinner.classList.add("hidden");
          status.classList.remove("hidden");
          statusImg.src = "./images/address-balance.svg";
          statusText.innerHTML = data.Balance.Balances[0] / 100000000 + " ADK";
          subStatus.innerHTML = "Balance";
          statusLink.href = API_URL.replace("/api", "");
        })
        .catch((error) => returnError());
    } else if (expTransaction.checked) {
      fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
          spinner.classList.add("hidden");
          status.classList.remove("hidden");
          statusImg.src = data.Confirmed
            ? "./images/confirmed-status.svg"
            : "./images/pending.svg";
          statusText.innerHTML = data.Confirmed ? "Confirmed" : "Pending";
          subStatus.innerHTML = "Current Status";
          statusAmount.classList.remove("hidden");
          amount.innerHTML = "ADK " + data.Value / 100000000;
          statusLink.href = API_URL.replace("/api", "");
        })
        .catch((error) => returnError());
    } else if (expBundle.checked) {
      fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
          spinner.classList.add("hidden");
          status.classList.remove("hidden");
          statusAmount.classList.add("hidden");
          statusImg.src = data.Confirmed
            ? "./images/confirmed-status.svg"
            : "./images/pending.svg";
          statusText.innerHTML = data.Confirmed ? "Confirmed" : "Pending";
          subStatus.innerHTML = "Current Status";
          statusLink.href = API_URL.replace("/api", "");
        })
        .catch((error) => returnError());
    }
  }

  expAddress.addEventListener("click", () => {
    expInputValue.placeholder = "Enter address to search";
    expRadioValue = expAddress.value;
    callAPI();
  });
  expTransaction.addEventListener("click", () => {
    expInputValue.placeholder = "Enter transaction to search";
    expRadioValue = expTransaction.value;
    callAPI();
  });
  expBundle.addEventListener("click", () => {
    expInputValue.placeholder = "Enter bundle to search";
    expRadioValue = expBundle.value;
    callAPI();
  });

  clearBtn.addEventListener("click", () => {
    expInputValue.value = "";
  });

  expForm.addEventListener("submit", (e) => {
    e.preventDefault();
    explorer.classList.add("hidden");
    callAPI();
    fetchAPI();
  });

  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    expInputValue.value = "";
    status.classList.add("hidden");
    explorer.classList.remove("hidden");
  });
}

// Create key pad for pin
function pinPad() {
  const pads = document.querySelectorAll("#pin-pad");
  pads.forEach((pad) => {
    pad.insertAdjacentHTML(
      "afterbegin",
      `<input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="1"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="2"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="3"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="4"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="5"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="6"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="7"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="8"
  />
  <input
    type="button"
    class="py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="9"
  />
  
  <input
    type="button"
    class="col-start-2 py-3 px-10 rounded-lg text-lg bg-white cursor-pointer"
    id="pin-pad-btn"
    value="0"
  />
  <button
    type="button"
    class="col-start-3 flex items-center justify-center"
    id="pin-pad-btn"
    value="Backspace"
  >
    <img
      src="./images/delete.svg"
      alt=""
      class="absolute"
      onload="SVGInject(this)"
    />
  </button>`
    );
  });
}

// Open Notification
function openNotification() {
  const notifBtn = document.getElementById("notification-btn");
  const notification = document.querySelector(".notification-wrapper");
  const notifHolder = document.querySelector(".notification-holder");
  window.addEventListener("click", (e) => {
    if (notifBtn.contains(e.target)) {
      notifBtn.classList.remove("active");
      notification.classList.toggle("hidden");
    } else {
      notification.classList.add("hidden");
    }
  });

  if (notifHolder.hasChildNodes()) {
    console.log(true);
    notifBtn.classList.add("active");
  }
  // notifBtn.addEventListener("click", () => {
  //   notification.classList.toggle("hidden");
  // });
}

//Settings Page

function settingsConfig() {
  const editNodeBtn = document.getElementById("edit-node-btn");

  editNodeBtn.addEventListener("click", () => {
    // editNodeConfiguration();
    ipcRenderer.send("settingsEditNode");
  });
}

function preventFromJumping() {
  const paginationLinks = document.querySelectorAll(".pagination li a");
  paginationLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      console.log("clicked");
      e.preventDefault();
    });
  });
}

function toggleSmartData() {
  var x = document.getElementById("transfer-additional-data");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

// Load functions when dom is ready
document.addEventListener(
  "DOMContentLoaded",
  () => {
    getTodayDate();
    openTab();
    detailAsAccrdn();
    fetchData();
    pinPad();
    openNotification();
    settingsConfig();
    preventFromJumping();
  },
  false
);
