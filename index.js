const moment = require('moment');
const log = message => console.log(`[${moment().format()}] ${message}`);
const {
  listPullRequests,
  getPullRequest,
  getIssue,
  listPullRequestReactions,
  mergePullRequest,
  closePullRequest,
} = require('./clients/github');

const pullRequestLabelReadyToMerge = 'ready to merge';

process.on('unhandledRejection', error => {
  console.error(error);
  process.exit(1);
});

const main = async () => {
  log('Implementing democracy. Resistence is futile.');
  const pullRequests = await listPullRequests();
  const votes = await getPullRequestsVotes(pullRequests);

  processPullRequest(votes);
  log('Democracy will be back.');
};

const getPullRequestsVotes = async pullRequests => {
  const votes = {};

  for (const pullRequest of pullRequests) {
    // const data = await Promise.all(getPullRequest(pullRequest.number), getIssue(pullRequest.number));
    const singlePullRequest = await getPullRequest(pullRequest.number);
    const issue = await getIssue(pullRequest.number);

    const pullRequestData = {
      updated_at: singlePullRequest.updated_at,
      labels: issue.labels,
      mergeable: singlePullRequest.mergeable,
    };

    if (!validatePullRequest(pullRequestData)) {
      continue;
    }

    votes[pullRequest.number] = await getVoteResult(pullRequest.number);
  }

  return votes;
}

const getVoteResult = async pullRequestNumber => {
  const reactions = await listPullRequestReactions(pullRequestNumber);

  let voteResult = 0;
  const voteReactionRegex = new RegExp('(\\+|-)1');

  reactions
    .filter(reaction => voteReactionRegex.test(reaction.content))
    .map(reaction => voteResult = voteResult + parseInt(reaction.content))
  ;

  return voteResult;
}

const validatePullRequest = pullRequest => {
  const now = moment().utc();
  const updatedAt24hoursForward = moment(pullRequest.updated_at).utc().add(4, 'h');
  const pullRequestIsMature = updatedAt24hoursForward.diff(now, 'minutes') < 0;
  const pullRequestIsReadyToMerge = pullRequest.labels.find(element => pullRequestLabelReadyToMerge === element.name);
  const pullRequestIsMergeable = pullRequest.mergeable;

  return pullRequestIsMature && pullRequestIsReadyToMerge && pullRequestIsMergeable;
}

const processPullRequest = async pullRequestsVoteResults => {
  const voteResult = {};

  for (const i in pullRequestsVoteResults) {
    const pullRequestVoteResult = pullRequestsVoteResults[i];
    if (pullRequestVoteResult > 0) {
      await mergePullRequest(i);
      log(`Pull Request #${i} has been merged.`);
    } else {
      await closePullRequest(i);
      log(`Pull Request #${i} has been closed.`);
    }
  }
};

main();
