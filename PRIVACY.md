# Privacy policy

Sub-issue Fields for GitHub shows GitHub Projects field values next to each sub-issue on GitHub issue pages.

## What it stores

- **Your GitHub personal access token** and **your list of field names**, saved with `chrome.storage.local` in your browser. They are never synced or sent anywhere except as described below.

## What it sends, and where

- When you open a GitHub issue that has sub-issues, the extension sends one request to the GitHub GraphQL API (`https://api.github.com/graphql`), authenticated with your token, asking for that issue's sub-issues and their project field values.
- Nothing is sent to the developer or to any other third party. There is no analytics, tracking, advertising or remote code.

## What it reads on the page

- On `github.com` pages, the extension reads the issue URL and the links in the Sub-issues list so it knows where to show the field values. It does not collect or transmit page content.

## Removing your data

- Clear the token in the extension's options, or uninstall the extension, which deletes everything it stored.
- You can revoke the token at any time at https://github.com/settings/tokens.

## Contact

Open an issue at https://github.com/dafzthomas/gh-subissue-fields/issues.

Last updated: 6 October 2026.
