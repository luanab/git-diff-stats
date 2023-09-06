const TITLE_REGEX = /Pull requests/

const NOTIFICATION = {
    type: 'basic',
    iconUrl: 'logo.png',
    title: `Git Diff Stats Failure`,
}

chrome.runtime.onMessage.addListener(({ success, domain }) =>
    success
        ? chrome.notifications.clear(domain)
        : chrome.notifications.create(domain, {
              ...NOTIFICATION,
              message: `Please verify that the given credentials for ${domain} are correct and have sufficient access.`,
          })
)

chrome.tabs.onUpdated.addListener(
    (id, changes) => TITLE_REGEX.test(changes.title) && chrome.tabs.sendMessage(id, {})
)
