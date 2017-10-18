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

      try {
        const json = JSON.parse(body, 'utf8');
        resolve(json);
      } catch (e) {
        console.log(e);
        resolve(e);
      }
    })
  })
);

const main = async () => {
  const pullRequests = await getPullRequests();
  const votes = await getPullRequestsVotes(pullRequests);

  processPullRequest(votes);
};

const getPullRequests = () => getRequestPromise({ url: pullRequestUrl + '?state=open', gzip: true, headers: { 'User-Agent': 'NodeJS' } });

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

const getPullRequestReaction = pullRequestNumber => {
  const pullRequestReactionUrl = `${pullRequestUrl}/${pullRequestNumber}/reactions`;
  const options = {
    url: pullRequestReactionUrl,
    gzip: true,
    headers: {
      'Accept': 'application/vnd.github.squirrel-girl-preview',
      'User-Agent': 'NodeJS',
    }
  };

  return getRequestPromise(options);
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
    url: pullRequestMergeUrl,
    method: 'PUT'
  });

  merge.then(data => console.log(data));
};

const closePullRequest = pullRequestNumber => {
  const pullRequestCloseUrl = `${repositoryUrl}/pulls/${pullRequestNumber}`;

  console.log(`Closing Pull Request #${pullRequestNumber}`);

  const close = getRequestPromise({
    url: pullRequestCloseUrl,
    method: 'PATCH',
    headers: { 'Authorization': `token ${oauthToken}`, 'User-Agent': 'NodeJS' },
    json: { state: 'closed' },
  });

  close.then(data => console.log(data));
};

main();
