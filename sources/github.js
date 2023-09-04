export default {
    pathRegex: /^(?:\/([^\/]+)\/([^\/]+))?\/pulls$/,
    host: 'https://api.github.com/graphql',
    auth: 'Bearer',
    css: {
        type: 'span',
        classes: {
            files: 'Counter ml-1',
            additions: 'color-fg-success ml-1',
            deletions: 'color-fg-danger ml-1',
        },
    },
    getElements: async function (document) {
        return document.body.querySelectorAll('div[id^=issue_]')
    },
    getResource: function (element, match) {
        const [, id] = element.id.match(/^issue_(\d+)/)
        const [, org, repo] =
            match[0] === '/pulls' ? element.id.match(/^issue_\d+_([^_]+)_([^_]+)$/) : match
        return `repository(owner: "${org}", name: "${repo}") {
            pullRequest(number: ${id}) {
                changedFiles
                additions
                deletions
            }
        }`
    },
    parseResponse: function (data) {
        const { changedFiles, additions, deletions } = data.repository.pullRequest
        return { files: changedFiles, additions, deletions }
    },
    getParentNode: function (element) {
        return element.querySelector('[class="opened-by"]').parentNode
    },
}
