# Chrome Web Store listing

Copy these into the developer dashboard.

## Store listing

**Name:** Sub-issue Fields for GitHub

**Summary (132 characters max):** Show GitHub Projects fields like Status and Priority on each row of an issue's Sub-issues list.

**Category:** Developer Tools

**Description:**

See your GitHub Projects fields right where you plan work. Sub-issue Fields for GitHub adds coloured pills to every row of an issue's Sub-issues list, showing values like Status, Priority, Iteration or Deadline without opening each sub-issue or switching to the project board.

- Choose which fields to show and in what order.
- Uses each option's colour from your project, in light and dark themes.
- Shows a pill per project when a sub-issue belongs to more than one.
- Works on issue pages and on issues opened from a project board.
- One API request per issue. No tracking, no analytics, open source.

Setup: create a classic GitHub personal access token with the repo and read:project scopes, then paste it into the extension's options (click the toolbar icon). If your organisation uses SAML SSO, authorise the token for it.

Not affiliated with or endorsed by GitHub. Source: https://github.com/dafzthomas/gh-subissue-fields

**Images:** store icon `icons/icon-128.png`. Screenshots: `store/screenshot-light.png`, `store/screenshot-dark.png`. Small promo tile: `store/promo-small.png`.

## Privacy practices

**Single purpose:** Show GitHub Projects field values on each row of a GitHub issue's Sub-issues list.

**Permission justifications:**

- `storage` — saves the user's GitHub token and chosen field names locally so they persist between sessions.
- Host permission `https://github.com/*` (content script) — reads the issue URL and Sub-issues list links on GitHub issue pages and adds the field pills next to each sub-issue.

**Remote code:** No, I am not using remote code.

**Data usage:** Tick **Authentication information** (the GitHub token, stored locally and sent only to api.github.com to fetch field values). Tick nothing else. Certify all three statements: not sold to third parties, not used for unrelated purposes, not used for creditworthiness or lending.

**Privacy policy URL:** https://github.com/dafzthomas/gh-subissue-fields/blob/main/PRIVACY.md
