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
        appendSpan(span, 'gl-badge badge badge-pill badge-muted sm', 'files', stats.fileCount)
        appendSpan(span, 'gl-text-green-600 bold', 'additions', '+' + stats.additions)
        appendSpan(span, 'gl-text-red-500 bold', 'deletions', '-' + stats.deletions)
        element.querySelector('[class*="issuable-authored"]').append(span)
    } else {
        updateSpan(element, 'files', stats.fileCount)
        updateSpan(element, 'additions', '+' + stats.additions)
        updateSpan(element, 'deletions', '-' + stats.deletions)
    }
}

export async function inject(token, path) {
    const match = PATH_REGEX.test(path)
    if (!token || !match) {
        return
    }
    const elements = document.body.querySelectorAll('li[id^=merge_request_]')
    const promises = []
    for (const element of elements) {
        const id = element.getAttribute('data-id')
        const promise = getDiffStats(token, id)
        promises.concat(promise.then((stats) => updateHtml(element, stats)))
    }
    await Promise.all(promises)
}
