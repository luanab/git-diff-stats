export default {
    pathRegex: /^(\/[^\/]+\/[^\/]+\/-\/merge_requests)|(\/dashboard\/merge_requests)$/,
    host: 'https://gitlab.com/api/graphql',
    auth: 'Bearer',
    css: {
        type: 'span',
        classes: {
            files: 'gl-badge badge badge-pill badge-muted sm ml-1',
            additions: 'gl-text-green-600 bold ml-1',
            deletions: 'gl-text-red-500 bold ml-1',
        },
    },
    getElements: async function (document) {
        return document.body.querySelectorAll('li[id^=merge_request_]')
    },
    getResource: function (element) {
        const id = element.getAttribute('data-id')
        return `mergeRequest(id: "gid://gitlab/MergeRequest/${id}") {
            diffStatsSummary {
                fileCount
                additions
                deletions
            }
        }`
    },
    parseResponse: function (data) {
        const { fileCount, additions, deletions } = data.mergeRequest.diffStatsSummary
        return { files: fileCount, additions, deletions }
    },
    getParentNode: function (element) {
        return element.querySelector('[class*="issuable-authored"]')
    },
}
