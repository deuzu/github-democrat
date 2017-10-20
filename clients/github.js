const request = require('./promise.js');
const config = require('dotenv').config();

const oauthToken = process.env.GITHUB_OAUTH_TOKEN;
const scheme = 'https://';
const githubHost = 'api.github.com';
const organization = process.env.GITHUB_ORGANIZATION;
const repositoryName = process.env.GITHUB_REPOSITORY;
const repositoryUrl = `${scheme}${githubHost}/repos/${organization}/${repositoryName}`;
const pullRequestUrl = `${repositoryUrl}/pulls`;
const issueUrl = `${repositoryUrl}/issues`;

const requestGithub = requestOptions => {
  const defaultHeaders = {
    'Authorization': `token ${oauthToken}`,
    'User-Agent': 'NodeJS'
  };

  requestOptions.gzip = true;
  requestOptions.headers = Object.assign(defaultHeaders, requestOptions.headers);

  return request(requestOptions);
}

const listPullRequests = async () => {
  const requestBody = await requestGithub({ url: pullRequestUrl + '?state=open' });

  return JSON.parse(requestBody);
}

const getPullRequest = async pullRequestNumber => {
  const requestBody = await requestGithub({ url: `${pullRequestUrl}/${pullRequestNumber}` });

  return JSON.parse(requestBody);
}

const getIssue = async pullRequestNumber => {
  const requestBody = await requestGithub({ url: `${issueUrl}/${pullRequestNumber}` });

  return JSON.parse(requestBody);
}

const listPullRequestReactions = async pullRequestNumber => {
  const options = {
    url: `${issueUrl}/${pullRequestNumber}/reactions`,
    headers: {
      'Accept': 'application/vnd.github.squirrel-girl-preview',
    }
  };

  const requestBody = await requestGithub(options);

  return JSON.parse(requestBody);
};

const mergePullRequest = pullRequestNumber => {
  return requestGithub({
    method: 'PUT',
    url: `${repositoryUrl}/pulls/${pullRequestNumber}/merge`,
  });
};

const closePullRequest = pullRequestNumber => {
  return requestGithub({
    method: 'PATCH',
    url: `${repositoryUrl}/pulls/${pullRequestNumber}`,
    json: { state: 'closed' },
  });
};

module.exports = {
  listPullRequests,
  getPullRequest,
  getIssue,
  listPullRequestReactions,
  mergePullRequest,
  closePullRequest,
};
