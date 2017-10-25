Github Democrat
===============

The Github Democrat is a bot that enforces democracy on a repository.
It checks open pull requests every hours and merge the ones that satisfy constraints.

The bot merges PRs that are:
  - open
  - mergeable
  - labelled with "ready to merge"
  - not modified for 24 hours
  - voted positively (more :+1: than :-1: on the PR description)


## Installation

```bash
npm install
```

Edit / create the file `.env` to set the value `GITHUB_OAUTH_TOKEN`, `GITHUB_ORGANIZATION` and `GITHUB_REPOSITORY`.
```
GITHUB_OAUTH_TOKEN=12345awesometoken67890
GITHUB_ORGANIZATION=YourOrgName
GITHUB_REPOSITORY=RepoName
```

## Usage

```bash
node index.js
```

In a cron that run every hour:

```
0 * * * * cd /path/to/github-democrat && /absolute/path/to/node index.js &>> /var/log/github-democrat.log
```
