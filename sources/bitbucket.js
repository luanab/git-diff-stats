const PATH_REGEX = /^(?:\/([^\/]+)\/([^\/]+))?\/pull-requests$/

function get(token, resource) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                if (request.status != 200) {
                    reject()
                } else {
                    resolve(JSON.parse(request.responseText))
                }
            }
        }
        request.open('GET', `https://api.bitbucket.org/2.0${resource}`, true)
        if (token) {
            request.setRequestHeader('Authorization', `Basic ${token}`)
        }
        request.send()
    })
}

async function getDiffStats(token, org, repo, pr) {
    const resource = `/repositories/${org}/${repo}/pullrequests/${pr}/diffstat`
    const files = (await get(token, resource)).values
    return {
        changedFiles: files.length,
        additions: files.reduce((acc, { lines_added }) => acc + lines_added, 0),
        deletions: files.reduce((acc, { lines_removed }) => acc + lines_removed, 0),
    }
}

function appendSpan(element, style, id, value) {
    const span = document.createElement('span')
    span.style = style
    span.id = id
    span.textContent = value
    element.append(span)
}

function updateSpan(element, id, value) {
    element.querySelector(`[id="${id}"]`).textContent = value
}

function updateHtml(element, stats) {
    if (!element.querySelector('td[id="stats"]')) {
        const td = document.createElement('td')
        td.id = 'stats'
        td.colSpan = 3
        appendSpan(
            td,
            'background-color: #DFE1E6; border-radius: 2em; padding: 0 6px',
            'files',
            stats.changedFiles
        )
        appendSpan(td, 'color: #006644', 'additions', '+' + stats.additions)
        appendSpan(td, 'color: #BF2600', 'deletions', '-' + stats.deletions)
        element.querySelector('td').parentNode.appendChild(td)
    } else {
        updateSpan(element, 'files', stats.changedFiles)
        updateSpan(element, 'additions', '+' + stats.additions)
        updateSpan(element, 'deletions', '-' + stats.deletions)
    }
}

export async function inject(token, path) {
    const match = PATH_REGEX.test(path)
    if (!match) {
        return
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const elements = document.body.querySelectorAll('tr[data-qa="pull-request-row"]')
    const promises = []
    for (const element of elements) {
        const [, org, repo, pr] = element
            .querySelector('a[data-qa="pull-request-row-link"]')
            .getAttribute('href')
            .match(/\/([^\/]+)\/([^\/]+)\/pull-requests\/(\d+)/)
        const promise = getDiffStats(token, org, repo, pr)
        promises.concat(promise.then((diff) => updateHtml(element, diff)))
    }
    await Promise.all(promises)
}
