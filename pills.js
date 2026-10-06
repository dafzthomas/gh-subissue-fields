const DEFAULT_FIELDS = 'Status, Priority, Kind, Deadline';
const COLORS = new Set(['GRAY', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'RED', 'PINK', 'PURPLE']);

function parseFieldList(text) {
	return text.split(',').map(name => name.trim()).filter(Boolean);
}

function valueLabel(value) {
	switch (value.__typename) {
		case 'ProjectV2ItemFieldSingleSelectValue': return value.name;
		case 'ProjectV2ItemFieldDateValue': return value.date;
		case 'ProjectV2ItemFieldTextValue': return value.text;
		case 'ProjectV2ItemFieldNumberValue': return String(value.number);
		case 'ProjectV2ItemFieldIterationValue': return value.title;
		default: return undefined;
	}
}

function pillsFor(subIssue, fieldList) {
	const pills = [];
	for (const wanted of fieldList) {
		// Nodes can be null when GraphQL returns partial data (e.g. a project the token can't read).
		for (const item of subIssue.projectItems.nodes) {
			if (!item?.project) continue;
			const value = item.fieldValues.nodes.find(v => v?.field?.name.trim().toLowerCase() === wanted.toLowerCase());
			const label = value && valueLabel(value);
			if (!label) continue;
			pills.push({
				label,
				title: `${item.project.title} › ${value.field.name}`,
				color: COLORS.has(value.color) ? value.color : 'GRAY',
			});
		}
	}
	return pills;
}

const ISSUE_PATH = /^\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/;

// Returns [owner, repo, number] for an issue page, or for an issue opened in a project view's side pane.
function parentIssue(pathname, search) {
	const match = pathname.match(ISSUE_PATH);
	if (match) return match.slice(1);
	const pane = new URLSearchParams(search).get('issue')?.split('|');
	return pane?.length === 3 && /^\d+$/.test(pane[2]) ? pane : undefined;
}

// Holds one loaded value at a time, keyed by parent issue. A failed load (undefined)
// is kept for retryMs so a broken token doesn't refetch on every DOM change.
function issueCache(load, retryMs) {
	let current = {key: undefined, value: undefined};
	return {
		get(key, ...args) {
			if (current.key !== key) {
				const entry = {key, value: undefined};
				entry.value = load(...args).then(result => {
					if (result === undefined) setTimeout(() => current === entry && (current = {key: undefined}), retryMs);
					return result;
				});
				current = entry;
			}
			return current.value;
		},
		has: key => current.key === key,
		clear() {
			current = {key: undefined, value: undefined};
		},
	};
}

function issueKey(nameWithOwner, number) {
	return `${nameWithOwner}#${number}`.toLowerCase();
}

if (typeof module !== 'undefined') {
	module.exports = {DEFAULT_FIELDS, parseFieldList, pillsFor, issueKey, parentIssue, issueCache};
}
