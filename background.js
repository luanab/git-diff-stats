const REGEX = /^https:\/\/github.com\/[^\/]+\/[^\/]+\/pulls/

chrome.tabs.onUpdated.addListener(
    (id, changes) => REGEX.test(changes.url) && chrome.tabs.sendMessage(id, {})
)
