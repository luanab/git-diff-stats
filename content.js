const DOMAIN_REGEX = /([^\.]+)\.\w+$/

function handleResponse(request, graphql, resolve, reject) {
    if (request.readyState == 4) {
        if (request.status != 200) {
            reject()
        } else if (graphql) {
            const body = JSON.parse(request.responseText)
            if (body.errors?.length > 0) {
                reject()
            } else {
                resolve(body.data)
            }
        } else {
            resolve(JSON.parse(request.responseText))
        }
    }
}

function getData(host, authorization, resource) {
    return new Promise((resolve, reject) => {
        const graphql = host.endsWith('/graphql')
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => handleResponse(request, graphql, resolve, reject)
        if (graphql) {
            request.open('POST', host, true)
            request.setRequestHeader('Authorization', authorization)
            request.setRequestHeader('Content-Type', 'application/json')
            request.send(`{ "query": "{ ${resource.replace(/\s+/g, ' ').replace(/"/g, '\\"')} }" }`)
        } else {
            request.open('GET', `${host}${resource}`, true)
            request.setRequestHeader('Authorization', authorization)
            request.send()
        }
    })
}

function appendStat(element, id, value, css) {
    const span = document.createElement('span')
    span.id = id
    span.textContent = value
    if (css.styles) {
        span.style = css.styles[id]
    } else {
        span.className = css.classes[id]
    }
    element.append(span)
}

function updateStat(element, id, value) {
    element.querySelector(`[id="${id}"]`).textContent = value
}

function injectStats(parent, stats, css, getParentNode) {
    let element = parent.querySelector('[id="stats"]')
    if (!element) {
        element = document.createElement(css.type)
        element.id = 'stats'
        element.colSpan = 3
        appendStat(element, 'files', stats.files, css)
        appendStat(element, 'additions', '+' + stats.additions, css)
        appendStat(element, 'deletions', '-' + stats.deletions, css)
        getParentNode(parent).append(element)
    } else {
        updateStat(element, 'files', stats.files)
        updateStat(element, 'additions', '+' + stats.additions)
        updateStat(element, 'deletions', '-' + stats.deletions)
    }
}

async function run() {
    const [, domain] = document.location.hostname.match(DOMAIN_REGEX)
    const { default: source } = await import(chrome.runtime.getURL(`sources/${domain}.js`))
    const match = document.location.pathname.replace(/\/$/, '').match(source.pathRegex)
    const { tokens } = await chrome.storage.sync.get('tokens')
    const token = tokens?.[domain]
    if (!match || !token) {
        return
    }
    const authorization = `${source.auth} ${token}`
    const elements = await source.getElements(document)
    const promises = []
    for (const element of elements) {
        const resource = source.getResource(element, match)
        const promise = getData(source.host, authorization, resource)
            .then((data) => source.parseResponse(data))
            .then((stats) => injectStats(element, stats, source.css, source.getParentNode))
        promises.push(promise)
    }
    await Promise.all(promises)
        .then(() => chrome.runtime.sendMessage({ success: true, domain }))
        .catch(() => chrome.runtime.sendMessage({ success: false, domain }))
}

chrome.runtime.onMessage.addListener(run)

run()
