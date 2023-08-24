const restoreOptions = () =>
	chrome.storage.sync.get('token', ({ token }) => {
		document.getElementById('token').value = token
	})

const saveOptions = () => {
	const token = document.getElementById('token').value

	chrome.storage.sync.set({ token }, () => {
		const status = document.getElementById('status')
		status.textContent = 'Token saved successfully'
		setTimeout(() => (status.textContent = ''), 2 * 1000)
	})
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.getElementById('save').addEventListener('click', saveOptions)
