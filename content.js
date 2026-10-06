const ROW_LINK = 'a[class*="SubIssueTitle-module__titleAnchor"]';
const LIST = '[class*="SubIssuesListView-module__listContainer"]';
const LINK_PATH = /^\/([^/]+\/[^/]+)\/issues\/(\d+)/;

const FIELD = '... on ProjectV2FieldCommon { name }';
const QUERY = `query($owner: String!, $name: String!, $number: Int!) {
	repository(owner: $owner, name: $name) { issue(number: $number) { subIssues(first: 100) { nodes {
		number repository { nameWithOwner }
		projectItems(first: 10) { nodes { project { title } fieldValues(first: 50) { nodes {
			__typename
			... on ProjectV2ItemFieldSingleSelectValue { name color field { ${FIELD} } }
			... on ProjectV2ItemFieldDateValue { date field { ${FIELD} } }
			... on ProjectV2ItemFieldTextValue { text field { ${FIELD} } }
			... on ProjectV2ItemFieldNumberValue { number field { ${FIELD} } }
			... on ProjectV2ItemFieldIterationValue { title field { ${FIELD} } }
		} } } }
	} } } }
}`;

const cache = issueCache(fetchSubIssues, 30_000);

async function fetchSubIssues(token, owner, name, number) {
	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {Authorization: `bearer ${token}`, 'Content-Type': 'application/json'},
			body: JSON.stringify({query: QUERY, variables: {owner, name, number: Number(number)}}),
		});
		const json = await response.json();
		const nodes = json.data?.repository?.issue?.subIssues.nodes;
		if (!response.ok || !nodes) throw new Error(json.message ?? JSON.stringify(json.errors));
		// Partial errors still come with usable data for the nodes the token can read.
		if (json.errors) console.warn('[sub-issue-fields] Some project fields could not be read:', JSON.stringify(json.errors));
		return new Map(nodes.filter(Boolean).map(node => [issueKey(node.repository.nameWithOwner, node.number), node]));
	} catch (error) {
		console.warn('[sub-issue-fields] Could not load project fields:', error.message);
		return undefined;
	}
}

function rowKey(link) {
	const match = URL.parse(link.href)?.pathname.match(LINK_PATH);
	return match && issueKey(match[1], match[2]);
}

function buildPills(pills) {
	const container = document.createElement('span');
	container.className = 'ghsf-pills';
	for (const {label, title, color} of pills) {
		const pill = document.createElement('span');
		pill.className = 'ghsf-pill';
		pill.dataset.color = color;
		pill.title = title;
		pill.textContent = label;
		container.append(pill);
	}
	return container;
}

function showTokenLink() {
	for (const list of document.querySelectorAll(LIST)) {
		if (list.querySelector('.ghsf-token-link')) continue;
		const link = document.createElement('a');
		link.className = 'ghsf-token-link';
		link.href = '#';
		link.textContent = 'Set token for project fields';
		link.addEventListener('click', event => {
			event.preventDefault();
			chrome.runtime.sendMessage('ghsf:open-options');
		});
		list.prepend(link);
	}
}

async function render() {
	const parent = parentIssue(location.pathname, location.search);
	if (!parent || !document.querySelector(ROW_LINK)) return;
	const parentKey = parent.join('/').toLowerCase();

	const {token, fields} = await chrome.storage.local.get({token: '', fields: DEFAULT_FIELDS});
	if (!token) {
		showTokenLink();
		return;
	}

	const subIssues = await cache.get(parentKey, token, ...parent);
	// Ignore results for an issue the user has already navigated away from.
	if (!subIssues || !cache.has(parentKey)) return;

	const fieldList = parseFieldList(fields);
	for (const link of document.querySelectorAll(ROW_LINK)) {
		const title = link.parentElement;
		if (title.querySelector('.ghsf-pills')) continue;
		const subIssue = subIssues.get(rowKey(link));
		if (!subIssue) continue; // e.g. an expanded grandchild row
		const pills = pillsFor(subIssue, fieldList);
		if (pills.length > 0) link.after(buildPills(pills));
	}
}

let queue = Promise.resolve();
let scheduled = false;
function schedule() {
	if (scheduled) return;
	scheduled = true;
	setTimeout(() => {
		scheduled = false;
		// Catch so one failed render doesn't stop every later one.
		queue = queue.then(render).catch(error => console.warn('[sub-issue-fields] Render failed:', error));
	}, 100);
}

// Saved settings apply to open tabs straight away.
chrome.storage.onChanged.addListener(() => {
	cache.clear();
	for (const element of document.querySelectorAll('.ghsf-pills, .ghsf-token-link')) element.remove();
	schedule();
});

// GitHub navigates client-side and re-renders rows, so re-check on DOM changes.
new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
schedule();
