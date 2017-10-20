const request = require('request');
const moment = require('moment');
const config = require('dotenv').config();
const oauthToken = process.env.GITHUB_OAUTH_TOKEN;

const scheme = 'https://';
const githubHost = 'api.github.com';
const organization = process.env.GITHUB_ORGANIZATION;
const repositoryName = process.env.GITHUB_REPOSITORY;
const repositoryUrl = `${scheme}${githubHost}/repos/${organization}/${repositoryName}`;
const pullRequestUrl = `${repositoryUrl}/issues`;
const pullRequestLabelReadyToMerge = 'ready to merge';

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

const getRequestPromise = requestOptions => (
  new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (error || response.statusCode !== 200) {
        reject(error);

        return;
      }

      resolve(body);
    })
  })
);

const main = async () => {
  const pullRequests = await getPullRequests();
  const votes = await getPullRequestsVotes(pullRequests);

  processPullRequest(votes);
};

const getPullRequests = async () => {
  const requestBody = await getRequestPromise({ url: pullRequestUrl + '?state=open', gzip: true, headers: { 'User-Agent': 'NodeJS' } });

  return JSON.parse(requestBody);
}

const getPullRequestsVotes = async pullRequests => {
  const votes = {};

  for (const pullRequest of pullRequests) {
    const now = moment().utc();
    const updatedAt24hoursForward = moment(pullRequest.updated_at).add(1, 'd');
    const pullRequestIsMature = updatedAt24hoursForward.diff(now, 'minutes') > 0;
    const pullRequestIsReadyToMerge = pullRequest.labels.find(element => pullRequestLabelReadyToMerge === element.name);

    if (!pullRequestIsMature || !pullRequestIsReadyToMerge) {
      continue;
    }

    votes[pullRequest.number] = await getVoteResult(pullRequest.number);
  }

  return votes;
}

const getVoteResult = async pullRequestNumber => {
  const reactions = await getPullRequestReaction(pullRequestNumber);

  let voteResult = 0;
  const voteReactionRegex = new RegExp('(\\+|-)1');

  reactions
    .filter(reaction => voteReactionRegex.test(reaction.content))
    .map(reaction => voteResult = voteResult + parseInt(reaction.content))
  ;

  return voteResult;
}

const getPullRequestReaction = async pullRequestNumber => {
  const pullRequestReactionUrl = `${pullRequestUrl}/${pullRequestNumber}/reactions`;
  const options = {
    url: pullRequestReactionUrl,
    gzip: true,
    headers: {
      'Accept': 'application/vnd.github.squirrel-girl-preview',
      'User-Agent': 'NodeJS',
    }
  };

  const requestBody = await getRequestPromise(options);

  return JSON.parse(requestBody);
};

const processPullRequest = pullRequestsVoteResults => {
  const voteResult = {};

  for (const i in pullRequestsVoteResults) {
    const pullRequestVoteResult = pullRequestsVoteResults[i];
    if (pullRequestVoteResult > 0) {
      mergePullRequest(i);
    } else {
      closePullRequest(i);
    }
  }
};

const mergePullRequest = pullRequestNumber => {
  const pullRequestMergeUrl = `${repositoryUrl}/pulls/${pullRequestNumber}/merge`;

  console.log(`Merging Pull Request #${pullRequestNumber}`);

  const merge = getRequestPromise({
    method: 'PUT',
    url: pullRequestMergeUrl,
    headers: { 'Authorization': `token ${oauthToken}`, 'User-Agent': 'NodeJS' },
  });

  merge.then(body => console.log(body));
};

const closePullRequest = pullRequestNumber => {
  const pullRequestCloseUrl = `${repositoryUrl}/pulls/${pullRequestNumber}`;

  console.log(`Closing Pull Request #${pullRequestNumber}`);

  const close = getRequestPromise({
    method: 'PATCH',
    url: pullRequestCloseUrl,
    headers: { 'Authorization': `token ${oauthToken}`, 'User-Agent': 'NodeJS' },
    json: { state: 'closed' },
  });

  close.then(body => console.log(body));
};

main();
