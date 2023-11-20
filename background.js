chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        tab.url &&
        tab.url.includes("google.com/search") &&
        !tab.url.includes("tbm=") &&
        !tab.url.includes("google.com/sorry")
    ) {
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);

        chrome.tabs.sendMessage(tabId, {
            type: "SEARCH",
            query: urlParameters.get("q"),
        });
    }
});
