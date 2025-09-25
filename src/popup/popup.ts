const button = document.getElementById("viewConnections") as HTMLButtonElement;

button.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
});
