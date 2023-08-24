function get(token, query) {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest()
		request.onreadystatechange = () => {
			if (request.readyState == 4) {
				if (request.status == 200)
					resolve(JSON.parse(request.responseText).data)
				else
					reject(request.status)
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
	return (await get(token, query)).repository.pullRequests.nodes
}

function createSpan(style, value) {
	const span = document.createElement('span')
	span.className = `${style} ml-1`
	span.textContent = value
	return span
}

function injectHtml(div, pr) {
	const element = document.createElement('div')
	element.append(
		createSpan('Counter', pr.changedFiles),
		createSpan('color-fg-success', '+' + pr.additions),
		createSpan('color-fg-danger', '-' + pr.deletions)
	)
	div.querySelector('[class="opened-by"]').parentNode.append(element)
}

chrome.storage.sync.get('token', async ({ token }) => {
	if (!token)
		return

	const [, org, repo] = document.URL.match(/https:\/\/github.com\/([^\/]*)\/([^\/]*)\/pulls/)

	const total = await getOpenPullRequestCount(token, org, repo)
	const prs = (await getOpenPullRequests(token, org, repo, total))
		.reduce((data, pr) => Object.assign(data, { [pr.number]: pr }), {})

	const divs = document.body
		.querySelector('div[aria-label="Issues"]')
		.children.item(0).children

	for (const div of divs) {
		const [, id] = div.id.match(/issue_(\d+)/)
		const pr = prs[id]
		if (pr)
			injectHtml(div, pr)
	}
})
