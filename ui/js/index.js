// Get Today Date
function getTodayDate() {
  const options = { day: "numeric", month: "short" };
  const now = new Intl.DateTimeFormat(undefined, options).format(new Date());

  const today = document.querySelectorAll("span#today");

  today.forEach(function (todayItem) {
    todayItem.innerHTML = now;
  });
}

function openTab() {
  const tabs = document.querySelectorAll(".tab-btn");
  const tabsContent = document.querySelectorAll(".tab-content");

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
    tabsContent.forEach((tabContent) => {
      tabContent.classList.remove("active");
    });
  };

  const addActiveTab = (tab) => {
    tab.classList.add("active");
    const tabId = tab.getAttribute("href");
    const getTab = document.querySelector(tabId);
    getTab.classList.add("active");
  };
}

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

// Load functions when dom is ready
document.addEventListener(
  "DOMContentLoaded",
  () => {
    getTodayDate();
    openTab();
    detailAsAccrdn();
    fetchData();
  },
  false
);
