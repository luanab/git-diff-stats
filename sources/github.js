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

function appendSpan(element, style, id, value) {
    const span = document.createElement('span')
    span.className = `${style} ml-1`
    span.id = id
    span.textContent = value
    element.append(span)
}

function updateSpan(element, id, value) {
    element.querySelector(`span[id="${id}"]`).textContent = value
}

function updateHtml(element, stats) {
    if (!element.querySelector('span[id="stats"]')) {
        const span = document.createElement('span')
        span.id = 'stats'
        appendSpan(span, 'Counter', 'files', stats.changedFiles)
        appendSpan(span, 'color-fg-success', 'additions', '+' + stats.additions)
        appendSpan(span, 'color-fg-danger', 'deletions', '-' + stats.deletions)
        element.querySelector('[class="opened-by"]').parentNode.append(span)
    } else {
        updateSpan(element, 'files', stats.changedFiles)
        updateSpan(element, 'additions', '+' + stats.additions)
        updateSpan(element, 'deletions', '-' + stats.deletions)
    }
}

export async function inject(token, path) {
    const match = path.match(PATH_REGEX)
    if (!token || !match) {
        return
    }
    const elements = document.body.querySelectorAll('div[id^=issue_]')
    const promises = []
    for (const element of elements) {
        const [, id] = element.id.match(/^issue_(\d+)/)
        const [, org, repo] =
            match[0] === '/pulls' ? element.id.match(/^issue_\d+_([^_]+)_([^_]+)$/) : match
        const promise = getDiffStats(token, org, repo, id)
        promises.concat(promise.then((diff) => updateHtml(element, diff)))
    }
    await Promise.all(promises)
}
