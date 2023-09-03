const PATH_REGEX = /^(\/[^\/]+\/[^\/]+\/-\/merge_requests)|(\/dashboard\/merge_requests)$/

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
        request.open('POST', 'https://gitlab.com/api/graphql', true)
        request.setRequestHeader('Authorization', `Bearer ${token}`)
        request.setRequestHeader('Content-Type', 'application/json')
        request.send(`{ "query": "{ ${query.replace(/\s+/g, ' ').replace(/"/g, '\\"')} }" }`)
    })
}

async function getDiffStats(token, id) {
    const query = `mergeRequest(id: "gid://gitlab/MergeRequest/${id}") {
        diffStatsSummary {
            fileCount
            additions
            deletions
        }
    }`
    return (await get(token, query)).mergeRequest.diffStatsSummary
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
        appendSpan(element, 'gl-badge badge badge-pill badge-muted sm', 'files', stats.fileCount)
        appendSpan(element, 'gl-text-green-600 bold', 'additions', '+' + stats.additions)
        appendSpan(element, 'gl-text-red-500 bold', 'deletions', '-' + stats.deletions)
        item.querySelector('[class*="issuable-authored"]').append(element)
    } else {
        updateSpan(item, 'files', stats.fileCount)
        updateSpan(item, 'additions', '+' + stats.additions)
        updateSpan(item, 'deletions', '-' + stats.deletions)
    }
}

export async function inject(options, path) {
    const { token } = options?.gitlab ?? {}
    const match = PATH_REGEX.test(path)
    if (!token || !match) {
        return
    }
    const items = document.body.querySelectorAll('li[id^=merge_request_]')
    const promises = []
    for (const item of items) {
        const id = item.getAttribute('data-id')
        const promise = getDiffStats(token, id)
        promises.concat(promise.then((stats) => injectHtml(item, stats)))
    }
    await Promise.all(promises)
}
