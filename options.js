const MESSAGE_TIMEOUT = 2 * 1000

async function restoreOptions() {
    const { options } = await chrome.storage.sync.get('options')
    document.getElementById('github_token').value = options?.github?.token || ''
    document.getElementById('gitlab_token').value = options?.gitlab?.token || ''
    document.getElementById('bitbucket_username').value = options?.bitbucket?.username || ''
    document.getElementById('bitbucket_password').value = options?.bitbucket?.password || ''
}

async function saveOptions() {
    const options = {
        github: {
            token: document.getElementById('github_token').value,
        },
        gitlab: {
            token: document.getElementById('gitlab_token').value,
        },
        bitbucket: {
            username: document.getElementById('bitbucket_username').value,
            password: document.getElementById('bitbucket_password').value,
        },
    }
    await chrome.storage.sync.set({ options })
    const status = document.getElementById('status')
    status.textContent = 'Options saved successfully'
    setTimeout(() => (status.textContent = ''), MESSAGE_TIMEOUT)
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
