function get(token, query, callback) {
	const request = new XMLHttpRequest()
	request.onreadystatechange = () =>
		request.readyState == 4 &&
		request.status == 200 &&
		callback(JSON.parse(request.responseText))
	request.open('POST', 'https://api.github.com/graphql', true)
	request.setRequestHeader('Authorization', `bearer ${token}`)
	request.send(`{ "query": "{ ${query.replace(/\s+/g, ' ').replace(/"/g, '\\"')} }" }`)
}

function getPullRequestCount(token, org, repo, callback) {
	get(
		token,
		`repository(owner: "${org}", name: "${repo}") {
			pullRequests(states: OPEN) {
				totalCount
			}
		}`,
		(body) => callback(body.data.repository.pullRequests.totalCount)
	)
}

function getPullRequests(token, org, repo, total, callback) {
	get(
		token,
		`repository(owner: "${org}", name: "${repo}") {
			pullRequests(last: ${total}, states: OPEN) {
				nodes {
					number
					changedFiles
					additions
					deletions
				}
			}
		}`,
		(body) => callback(body.data.repository.pullRequests.nodes)
	)
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

chrome.storage.sync.get('token', ({ token }) => {
	if (!token)
		return

	const [, org, repo] = document.URL.match(/https:\/\/github.com\/([^\/]*)\/([^\/]*)\/pulls/)

	getPullRequestCount(token, org, repo, (total) =>
		getPullRequests(token, org, repo, total, (list) => {
			const prs = list.reduce((data, pr) => Object.assign(data, { [pr.number]: pr }), {})

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
	)
})
