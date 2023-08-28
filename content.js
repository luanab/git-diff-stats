const REGEX = /^(?:\/([^\/]+)\/([^\/]+))?\/pulls$/

function get(token, query) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                if (request.status != 200) {
                    reject()
                } else {
                    const body = JSON.parse(request.responseText)
                    if (body.errors?.length > 0) {
                        reject()
                    } else {
                        resolve(body.data)
                    }
                }
            }
        }
        request.open('POST', 'https://api.github.com/graphql', true)
        request.setRequestHeader('Authorization', `Bearer ${token}`)
        request.send(`{ "query": "{ ${query.replace(/\s+/g, ' ').replace(/"/g, '\\"')} }" }`)
    })
}

async function getPullRequestDiffStat(token, org, repo, id) {
    const query = `repository(owner: "${org}", name: "${repo}") {
        pullRequest(number: ${id}) {
            changedFiles
            additions
            deletions
        }
    }`
    return (await get(token, query)).repository.pullRequest
}

function appendSpan(div, style, id, value) {
    const span = document.createElement('span')
    span.className = `${style} ml-1`
    span.id = id
    span.textContent = value
    div.append(span)
}

function updateSpan(div, id, value) {
    div.querySelector(`[id="${id}"]`).textContent = value
}

function injectHtml(div, diff) {
    if (!div.querySelector('[id="stats"]')) {
        const element = document.createElement('div')
        element.id = 'stats'
        appendSpan(element, 'Counter', 'changedFiles', diff.changedFiles)
        appendSpan(element, 'color-fg-success', 'additions', '+' + diff.additions)
        appendSpan(element, 'color-fg-danger', 'deletions', '-' + diff.deletions)
        div.querySelector('[class="opened-by"]').parentNode.append(element)
    } else {
        updateSpan(div, 'changedFiles', diff.changedFiles)
        updateSpan(div, 'additions', '+' + diff.additions)
        updateSpan(div, 'deletions', '-' + diff.deletions)
    }
}

async function run() {
    try {
        const { token } = await chrome.storage.sync.get('token')
        const match = document.location.pathname.match(REGEX)
        if (!token || !match) {
            return
        }
        const divs = document.body.querySelectorAll('div[id^=issue_]')
        const promises = []
        for (const div of divs) {
            const [, id] = div.id.match(/^issue_(\d+)/)
            const [, org, repo] =
                match[0] === '/pulls' ? div.id.match(/^issue_\d+_([^_]+)_([^_]+)$/) : match
            const promise = getPullRequestDiffStat(token, org, repo, id)
            promises.concat(promise.then((diff) => injectHtml(div, diff)))
        }
        await Promise.all(promises)
        chrome.runtime.sendMessage({ success: true })
    } catch (error) {
        chrome.runtime.sendMessage({ success: false })
    }
}

chrome.runtime.onMessage.addListener(run)

run()
