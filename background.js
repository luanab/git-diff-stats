const REGEX = /^(https:\/\/)?github.com\/[^\/]+\/[^\/]+\/pulls/

chrome.tabs.onUpdated.addListener(
    (id, changes) => REGEX.test(changes.title) && chrome.tabs.sendMessage(id, {})
)
