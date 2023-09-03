const REGEX = /(\/[^\/]+\/[^\/]+)?\/pulls/

const NOTIFICATION = {
    type: 'basic',
    iconUrl: 'logo.png',
    title: `Git +1 Failure`,
    message: 'Please verify that the given credentials are correct and have sufficient access.',
}

chrome.runtime.onMessage.addListener(({ success, source }) =>
    success ? chrome.notifications.clear(source) : chrome.notifications.create(source, NOTIFICATION)
)

chrome.tabs.onUpdated.addListener(
    (id, changes) => REGEX.test(changes.title) && chrome.tabs.sendMessage(id, {})
)
