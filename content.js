const DOMAIN_REGEX = /([^\.]+)\.\w+$/

async function run() {
    const [, source] = document.location.hostname.match(DOMAIN_REGEX)
    const { inject } = await import(chrome.runtime.getURL(`sources/${source}.js`))
    const { tokens } = await chrome.storage.sync.get('tokens')
    await inject(tokens?.[source], document.location.pathname.replace(/\/$/, ''))
        .then(() => chrome.runtime.sendMessage({ success: true, source }))
        .catch(() => chrome.runtime.sendMessage({ success: false, source }))
}

chrome.runtime.onMessage.addListener(run)

run()
