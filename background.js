// Content scripts cannot open the options page themselves.
chrome.runtime.onMessage.addListener(message => {
	if (message === 'ghsf:open-options') chrome.runtime.openOptionsPage();
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
