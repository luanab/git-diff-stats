const REGEX = /(\/[^\/]+\/[^\/]+)?\/pulls/

const NOTIFICATION = {
    type: 'basic',
    iconUrl: 'logo.png',
    title: `GitHub +1 Failure`,
    message:
        'Please verify that the given access token has sufficient access (scope "repo" is required).',
}

chrome.runtime.onMessage.addListener(({ success }) =>
    success
        ? chrome.notifications.clear(NOTIFICATION_ID)
        : chrome.notifications.create(NOTIFICATION_ID, NOTIFICATION)
)

chrome.tabs.onUpdated.addListener(
    (id, changes) => REGEX.test(changes.title) && chrome.tabs.sendMessage(id, {})
)
