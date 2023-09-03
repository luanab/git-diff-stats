const PATH_REGEX = /^(?:\/([^\/]+)\/([^\/]+))?\/pulls$/

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

async function getDiffStats(token, org, repo, id) {
    const query = `repository(owner: "${org}", name: "${repo}") {
        pullRequest(number: ${id}) {
            changedFiles
            additions
            deletions
        }
    }`
    return (await get(token, query)).repository.pullRequest
}

function appendSpan(item, style, id, value) {
    const span = document.createElement('span')
    span.className = `${style} ml-1`
    span.id = id
    span.textContent = value
    item.append(span)
}

function updateSpan(item, id, value) {
    item.querySelector(`[id="${id}"]`).textContent = value
}

function injectHtml(item, stats) {
    if (!item.querySelector('[id="stats"]')) {
        const element = document.createElement('span')
        element.id = 'stats'
        appendSpan(element, 'Counter', 'files', stats.changedFiles)
        appendSpan(element, 'color-fg-success', 'additions', '+' + stats.additions)
        appendSpan(element, 'color-fg-danger', 'deletions', '-' + stats.deletions)
        item.querySelector('[class="opened-by"]').parentNode.append(element)
    } else {
        updateSpan(item, 'files', stats.changedFiles)
        updateSpan(item, 'additions', '+' + stats.additions)
        updateSpan(item, 'deletions', '-' + stats.deletions)
    }
}

export async function inject(options, path) {
    const { token } = options.github ?? {}
    const match = path.match(PATH_REGEX)
    if (!token || !match) {
        return
    }
    const items = document.body.querySelectorAll('div[id^=issue_]')
    const promises = []
    for (const item of items) {
        const [, id] = item.id.match(/^issue_(\d+)/)
        const [, org, repo] =
            match[0] === '/pulls' ? item.id.match(/^issue_\d+_([^_]+)_([^_]+)$/) : match
        const promise = getDiffStats(token, org, repo, id)
        promises.concat(promise.then((diff) => injectHtml(item, diff)))
    }
    await Promise.all(promises)
}
