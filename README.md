Github Democrat
===============

The Github Democrat is a bot that enforces democracy on a repository.
It checks open pull requests and merge the ones that satisfy constraints.

The bot merges PRs that are:
  - open
  - mergeable
  - prefixed with "[RDY]" (configurable)
  - last commit is older than 24 hours
  - voted positively (2 more reactions :+1: than :-1: on the PR description)


## Installation

```bash
npm install
```

Edit / create the file `.env` to set the value `GITHUB_OAUTH_TOKEN`, `GITHUB_ORGANIZATION` and `GITHUB_REPOSITORY`.
```
GITHUB_OAUTH_TOKEN=12345awesometoken67890
GITHUB_ORGANIZATION=YourOrgName
GITHUB_REPOSITORY=RepoName
GITHUB_PULLREQUEST_DESCRIPTION_PREFIX_READYTOMERGE=[RDY]
```

*.env variable are overriden by nodejs environment variables*


## Usage

```bash
npm start
```

### Server

In a cron that run every hour:

```
0 * * * * cd /path/to/github-democrat && /absolute/path/to/node src/run.js &>> /var/log/github-democrat.log
```

## Serverless

```bash
npm aws
```

*...then upload the zip to aws*
