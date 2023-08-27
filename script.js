function get(token, query) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                if (request.status != 200) {
                    reject()
                } else {
                    const body = JSON.parse(request.responseText)
                    if (body.errors?.length > 0)
                        reject()
                    else
                        resolve(body.data)
                }
            }
        }
        request.open('POST', 'https://api.github.com/graphql', true)
        request.setRequestHeader('Authorization', `Bearer ${token}`)
        request.send(`{ "query": "{ ${query.replace(/\s+/g, ' ').replace(/"/g, '\\"')} }" }`)
    })
}

async function getOpenPullRequestCount(token, org, repo) {
    const query = `repository(owner: "${org}", name: "${repo}") {
        pullRequests(states: OPEN) {
            totalCount
        }
    }`
    return (await get(token, query)).repository.pullRequests.totalCount
}

async function getOpenPullRequests(token, org, repo, total) {
    const query = `repository(owner: "${org}", name: "${repo}") {
        pullRequests(last: ${total}, states: OPEN) {
            nodes {
                number
                changedFiles
                additions
                deletions
            }
        }
    }`
    return (await get(token, query)).repository.pullRequests.nodes.reduce(
        (prs, pr) => ({ ...prs, [pr.number]: pr }),
        {}
    )
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

function injectHtml(div, pr) {
    if (!div.querySelector('[id="stats"]')) {
        const element = document.createElement('div')
        element.id = 'stats'
        appendSpan(element, 'Counter', 'changedFiles', pr.changedFiles)
        appendSpan(element, 'color-fg-success', 'additions', '+' + pr.additions)
        appendSpan(element, 'color-fg-danger', 'deletions', '-' + pr.deletions)
        div.querySelector('[class="opened-by"]').parentNode.append(element)
    } else {
        updateSpan(div, 'changedFiles', pr.changedFiles)
        updateSpan(div, 'additions', '+' + pr.additions)
        updateSpan(div, 'deletions', '-' + pr.deletions)
    }
}

const REGEX = /^\/([^\/]+)\/([^\/]+)\/pulls$/

async function run() {
    try {
        const { token } = await chrome.storage.sync.get('token')
        const match = document.location.pathname.match(REGEX)
        if (!token || !match)
            return
    
        const [, org, repo] = match
    
        const total = await getOpenPullRequestCount(token, org, repo)
        const prs = await getOpenPullRequests(token, org, repo, total)
    
        const divs = document.body.querySelector('div[aria-label="Issues"]').children.item(0).children
    
        for (const div of divs) {
            const [, id] = div.id.match(/issue_(\d+)/)
            const pr = prs[id]
            if (pr)
                injectHtml(div, pr)
        }
        chrome.runtime.sendMessage({ success: true })
    } catch (error) {
        chrome.runtime.sendMessage({ success: false })
    }
}

chrome.runtime.onMessage.addListener(run)

run()
