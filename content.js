const DOMAIN_REGEX = /([^\.]+)\.\w+$/

async function run() {
    const [, source] = document.location.hostname.match(DOMAIN_REGEX)
    const { inject } = await import(chrome.runtime.getURL(`sources/${source}.js`))
    const { options } = await chrome.storage.sync.get('options')
    await inject(options ?? {}, document.location.pathname)
        .then(() => chrome.runtime.sendMessage({ success: true, source }))
        .catch(() => chrome.runtime.sendMessage({ success: false, source }))
}

chrome.runtime.onMessage.addListener(run)

run()
