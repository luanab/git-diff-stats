const PATH_REGEX = /^\/([^\/]+)\/([^\/]+)\/pulls$/
const PAGE_SIZE = 100

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

async function getOpenPullRequests(token, org, repo) {
    const prs = {}
    let cursor
    do {
        const query = `repository(owner: "${org}", name: "${repo}") {
            pullRequests(first: ${PAGE_SIZE}${cursor ? `, after: "${cursor}"` : ''}, states: OPEN) {
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                    number
                    changedFiles
                    additions
                    deletions
                }
            }
        }`
        const { pageInfo, nodes } = (await get(token, query)).repository.pullRequests
        cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null
        for (const { number, ...pr } of nodes)
            prs[number] = pr
    } while (cursor != null)
    return prs
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

async function run() {
    try {
        const { token } = await chrome.storage.sync.get('token')
        const match = document.location.pathname.match(PATH_REGEX)
        
        if (!token || !match)
            return
    
        const [, org, repo] = match
    
        const prs = await getOpenPullRequests(token, org, repo)

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
