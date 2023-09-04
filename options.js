const MESSAGE_TIMEOUT = 2 * 1000

async function restoreOptions() {
    const { tokens } = await chrome.storage.sync.get('tokens')
    document.getElementById('github_token').value = tokens?.github ?? ''
    document.getElementById('gitlab_token').value = tokens?.gitlab ?? ''
    const [bitbucket_username, bitbucket_password] = (atob(tokens?.bitbucket) || ':').split(':')
    document.getElementById('bitbucket_username').value = bitbucket_username
    document.getElementById('bitbucket_password').value = bitbucket_password
}

async function saveOptions() {
    const bitbucket_username = document.getElementById('bitbucket_username').value
    const bitbucket_password = document.getElementById('bitbucket_password').value
    const tokens = {
        github: document.getElementById('github_token').value,
        gitlab: document.getElementById('gitlab_token').value,
        bitbucket:
            bitbucket_username && bitbucket_password
                ? btoa(`${bitbucket_username}:${bitbucket_password}`)
                : '',
    }
    await chrome.storage.sync.set({ tokens })
    const status = document.getElementById('status')
    status.textContent = 'Options saved successfully'
    setTimeout(() => (status.textContent = ''), MESSAGE_TIMEOUT)
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
