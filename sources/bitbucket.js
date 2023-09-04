const HREF_REGEX = /\/([^\/]+)\/([^\/]+)\/pull-requests\/(\d+)/

export default {
    pathRegex: /^(?:\/([^\/]+)\/([^\/]+))?\/pull-requests$/,
    host: 'https://api.bitbucket.org/2.0',
    auth: 'Basic',
    css: {
        type: 'td',
        styles: {
            files: 'background-color: #DFE1E6; border-radius: 2em; padding: 0 6px',
            additions: 'color: #006644',
            deletions: 'color: #BF2600',
        },
    },
    getElements: async function (document) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return document.body.querySelectorAll('tr[data-qa="pull-request-row"]')
    },
    getResource: function (element) {
        const [, org, repo, pr] = element
            .querySelector('a[data-qa="pull-request-row-link"]')
            .getAttribute('href')
            .match(HREF_REGEX)
        return `/repositories/${org}/${repo}/pullrequests/${pr}/diffstat`
    },
    parseResponse: function (data) {
        const files = data.values
        return {
            files: files.length,
            additions: files.reduce((acc, { lines_added }) => acc + lines_added, 0),
            deletions: files.reduce((acc, { lines_removed }) => acc + lines_removed, 0),
        }
    },
    getParentNode: function (element) {
        return element.querySelector('td').parentNode
    },
}
