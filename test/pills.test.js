const test = require('node:test');
const assert = require('node:assert/strict');
const {DEFAULT_FIELDS, parseFieldList, pillsFor, issueKey, parentIssue, issueCache} = require('../pills.js');

const select = (field, name, color) => ({__typename: 'ProjectV2ItemFieldSingleSelectValue', name, color, field: {name: field}});
const item = (project, ...values) => ({project: {title: project}, fieldValues: {nodes: values}});
const sub = (...items) => ({number: 738, repository: {nameWithOwner: 'Org/Repo'}, projectItems: {nodes: items}});

test('parseFieldList trims, drops empties, keeps order', () => {
	assert.deepEqual(parseFieldList(' status ,PRIORITY,, Deadline '), ['status', 'PRIORITY', 'Deadline']);
	assert.deepEqual(parseFieldList(DEFAULT_FIELDS), ['Status', 'Priority', 'Kind', 'Deadline']);
});

test('pills follow field-list order, case-insensitively', () => {
	const s = sub(item('Team board', select('Priority', 'P2', 'YELLOW'), select('Status', 'Ready', 'GREEN')));
	assert.deepEqual(pillsFor(s, ['status', 'PRIORITY']), [
		{label: 'Ready', title: 'Team board › Status', color: 'GREEN'},
		{label: 'P2', title: 'Team board › Priority', color: 'YELLOW'},
	]);
});

test('same field in two projects gives one pill per project', () => {
	const s = sub(item('Team board', select('Status', 'Ready', 'GREEN')), item('Roadmap', select('Status', 'Discovery', 'YELLOW')));
	assert.deepEqual(pillsFor(s, ['Status']).map(p => p.title), ['Team board › Status', 'Roadmap › Status']);
});

test('date, text, number and iteration values render as grey pills', () => {
	const s = sub(item('Team board',
		{__typename: 'ProjectV2ItemFieldDateValue', date: '2026-10-31', field: {name: 'Deadline'}},
		{__typename: 'ProjectV2ItemFieldTextValue', text: 'CRO', field: {name: 'Metric'}},
		{__typename: 'ProjectV2ItemFieldNumberValue', number: 0, field: {name: 'Points'}},
		{__typename: 'ProjectV2ItemFieldIterationValue', title: 'Sprint 4', field: {name: 'Iteration'}},
	));
	assert.deepEqual(pillsFor(s, ['Deadline', 'Metric', 'Points', 'Iteration']).map(p => [p.label, p.color]), [
		['2026-10-31', 'GRAY'], ['CRO', 'GRAY'], ['0', 'GRAY'], ['Sprint 4', 'GRAY'],
	]);
});

test('values without a field, unknown types, and missing fields are skipped', () => {
	const s = sub(item('Team board',
		{__typename: 'ProjectV2ItemFieldRepositoryValue'},
		{__typename: 'ProjectV2ItemFieldUserValue', field: {name: 'Assignees'}},
	));
	assert.deepEqual(pillsFor(s, ['Assignees', 'Status']), []);
	assert.deepEqual(pillsFor(sub(), ['Status']), []);
});

test('unknown colours fall back to GRAY', () => {
	assert.equal(pillsFor(sub(item('P', select('Status', 'X', 'TEAL'))), ['Status'])[0].color, 'GRAY');
});

test('issueKey is case-insensitive and repo-qualified', () => {
	assert.equal(issueKey('Octo-Org/Repo', 738), 'octo-org/repo#738');
});

test('null project items, projects and field values from partial GraphQL errors are skipped', () => {
	const s = sub(null, {project: null, fieldValues: {nodes: [select('Status', 'Hidden', 'RED')]}}, item('Team board', null, select('Status', 'Ready', 'GREEN')));
	assert.deepEqual(pillsFor(s, ['Status']), [{label: 'Ready', title: 'Team board › Status', color: 'GREEN'}]);
});

test('field names are matched ignoring surrounding whitespace', () => {
	assert.equal(pillsFor(sub(item('Team board', select('Discipline ', 'Engineering', 'BLUE'))), ['Discipline'])[0].label, 'Engineering');
});

test('parentIssue reads issue pages and the project-view issue pane', () => {
	assert.deepEqual(parentIssue('/octo-org/planning/issues/699', ''), ['octo-org', 'planning', '699']);
	assert.deepEqual(parentIssue('/orgs/octo-org/projects/164/views/1', '?pane=issue&itemId=1&issue=octo-org%7Cplanning%7C699'), ['octo-org', 'planning', '699']);
	assert.equal(parentIssue('/orgs/octo-org/projects/164/views/1', ''), undefined);
	assert.equal(parentIssue('/octo-org/planning/pulls', ''), undefined);
});

test('issueCache loads once per key and reloads when the key changes', async () => {
	const calls = [];
	const cache = issueCache(async (...args) => (calls.push(args), args.join()), 1000);
	assert.equal(await cache.get('a', 1, 2), '1,2');
	assert.equal(await cache.get('a', 1, 2), '1,2');
	assert.equal(await cache.get('b', 3), '3');
	assert.deepEqual(calls, [[1, 2], [3]]);
	assert.equal(cache.has('b'), true);
	assert.equal(cache.has('a'), false);
});

test('issueCache retries a failed load only after the retry delay', async t => {
	t.mock.timers.enable({apis: ['setTimeout']});
	let calls = 0;
	const cache = issueCache(async () => (++calls, undefined), 30_000);
	assert.equal(await cache.get('a'), undefined);
	await cache.get('a');
	assert.equal(calls, 1);
	t.mock.timers.tick(30_000);
	await cache.get('a');
	assert.equal(calls, 2);
});

test('issueCache.clear forces the next get to reload', async () => {
	let calls = 0;
	const cache = issueCache(async () => ++calls, 1000);
	await cache.get('a');
	cache.clear();
	assert.equal(await cache.get('a'), 2);
});
