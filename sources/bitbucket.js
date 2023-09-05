const HREF_REGEX = /\/([^\/]+)\/([^\/]+)\/pull-requests\/(\d+)/

export default {
    pathRegex: /^(?:\/([^\/]+)\/([^\/]+))?\/pull-requests$/,
    host: 'https://api.bitbucket.org/2.0',
    auth: 'Basic',
    css: {
        type: 'td',
        styles: {
            files: 'border-radius: 2em; color: #172B4D; background-color: #DFE1E6; padding: 3px 8px',
            additions: 'font-weight: 600; color: #006644; background-color: #E3FCEF; padding: 3px 4px',
            deletions: 'font-weight: 600; color: #BF2600; background-color: #FFEBE6; padding: 3px 4px',
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
        return element.querySelector('small')
    },
}
