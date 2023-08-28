const MESSAGE_TIMEOUT = 2 * 1000

const restoreOptions = async () => {
    const { token } = await chrome.storage.sync.get('token')
    document.getElementById('token').value = token
}

const saveOptions = async () => {
    const token = document.getElementById('token').value
    await chrome.storage.sync.set({ token })
    const status = document.getElementById('status')
    status.textContent = 'Token saved successfully'
    setTimeout(() => (status.textContent = ''), MESSAGE_TIMEOUT)
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
