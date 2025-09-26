const button = document.getElementById("viewConnections");

if(!button){
  throw new Error("Button is not defined")
}

button.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
});
