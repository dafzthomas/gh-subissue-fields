const form = document.querySelector('#form');
const tokenInput = document.querySelector('#token');
const fieldsInput = document.querySelector('#fields');
const status = document.querySelector('#status');

chrome.storage.local.get({token: '', fields: DEFAULT_FIELDS}).then(({token, fields}) => {
	tokenInput.value = token;
	fieldsInput.value = fields;
});

form.addEventListener('submit', async event => {
	event.preventDefault();
	await chrome.storage.local.set({token: tokenInput.value.trim(), fields: fieldsInput.value});
	status.textContent = 'Saved.';
});
