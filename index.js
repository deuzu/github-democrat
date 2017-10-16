const request = require('request');
const oauthToken = '10c880288cc6299a32648a74247689eb6645304e';

const scheme = 'https://';
const githubHost = 'api.github.com';
const organization = '24chevres';
const repositoryName = '24chevres.com';
const pullRequestUrl = `${scheme}${githubHost}/repos/${organization}/${repositoryName}/issues`;
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

      resolve(JSON.parse(body, 'utf8'));
    })
  })
);

const main = async () => {
  const pullRequests = await getPullRequests();
  const votes = await getPullRequestsVotes(pullRequests);

  processPullRequest(votes);
};

const getPullRequests = () => getRequestPromise({ url: pullRequestUrl + '?state=open', gzip: true, headers: {'User-Agent': 'NodeJS'} });

const getPullRequestsVotes = async pullRequests => {
  const votes = {};

  for (const pullRequest of pullRequests) {
    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    const pullRequestIsMature = Math.abs(new Date() - new Date(pullRequest.updated_at)) > dayInMilliseconds;
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

  for (const pullRequestVoteResult of pullRequestsVoteResults) {
    if (pullRequestVoteResult > 0) {
      mergePullRequest();
    } else {
      closePullRequest();
    }
  }
};

const mergePullRequest = pullRequestNumber => {
  console.log(`Merging Pull Request #${number}`);
};

const closePullRequest = pullRequestNumber => {
  console.log(`Closing Pull Request #${number}`);
};

main();
