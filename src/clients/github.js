const request = require('./promise.js');

const oauthToken = process.env.GITHUB_OAUTH_TOKEN;
const scheme = 'https://';
const githubHost = 'api.github.com';
const organization = process.env.GITHUB_ORGANIZATION;
const repositoryName = process.env.GITHUB_REPOSITORY;
const repositoryUrl = `${scheme}${githubHost}/repos/${organization}/${repositoryName}`;
const pullRequestUrl = `${repositoryUrl}/pulls`;
const issueUrl = `${repositoryUrl}/issues`;
const organizationUrl = `${scheme}${githubHost}/orgs`;
const organizationMembersUrl = `${organizationUrl}/${organization}/members`;

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

const getLastCommit = async pullRequestNumber => {
  const requestBody = await requestGithub({ url: `${pullRequestUrl}/${pullRequestNumber}/commits` });
  const commits = JSON.parse(requestBody);
  const lastCommit = commits.pop();

  return lastCommit;
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

const getOrganizationMembers = async () => {
    const options = {
      url: organizationMembersUrl
    }

    const requestBodyOrga = await requestGithub(options);

    return JSON.parse(requestBodyOrga).map(value => ( value.id ));
}

const mergePullRequest = pullRequestNumber => {
  return requestGithub({
    method: 'PUT',
    url: `${repositoryUrl}/pulls/${pullRequestNumber}/merge`,
  });
};

module.exports = {
  listPullRequests,
  getPullRequest,
  getIssue,
  getLastCommit,
  listPullRequestReactions,
  getOrganizationMembers,
  mergePullRequest,
};
