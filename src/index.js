const config = require('dotenv').config();
const moment = require('moment');
const {
  listPullRequests,
  getPullRequest,
  getIssue,
  getLastCommit,
  listPullRequestReactions,
  getOrganizationMembers,
  mergePullRequest,
} = require('./clients/github');

const log = message => console.log(`[${moment().format()}] ${message}`);
const pullRequestReadyToMergePrefix = process.env.GITHUB_PULLREQUEST_DESCRIPTION_PREFIX_READYTOMERGE;

process.on('unhandledRejection', error => {
  console.error(error);
  process.exit(1);
});

const run = async () => {
  log(`Implementing democracy on ${process.env.GITHUB_ORGANIZATION}/${process.env.GITHUB_REPOSITORY}. Resistence is futile.`);
  const pullRequests = await listPullRequests();
  const votes = await getPullRequestsVotes(pullRequests);

  processPullRequest(votes);
  log('Democracy will be back.');
};

const getPullRequestsVotes = async pullRequests => {
  const votes = {};

  for (const pullRequest of pullRequests) {
    // const data = await Promise.all(getPullRequest(pullRequest.number), getIssue(pullRequest.number), getLastCommit(pullRequest.number));
    const singlePullRequest = await getPullRequest(pullRequest.number);
    const issue = await getIssue(pullRequest.number);
    const lastCommit = await getLastCommit(pullRequest.number);

    const pullRequestData = {
      updatedAt: lastCommit.commit.committer.date,
      title: pullRequest.title,
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
  const voters = await getOrganizationMembers();

  let voteResult = 0;
  const voteReactionRegex = new RegExp('(\\+|-)1');

  reactions
    .filter(reaction => {
      const reactionIsVote = voteReactionRegex.test(reaction.content);
      const userHasRightToVote = voters.indexOf(reaction.user.id);

      return reactionIsVote && userHasRightToVote;
    })
    .map(reaction => voteResult = voteResult + parseInt(reaction.content))
  ;

  return voteResult;
}

const validatePullRequest = (pullRequest) => {
  const now = moment().utc();
  const updatedAt24hoursForward = moment(pullRequest.updatedAt).utc().add(24, 'h');
  const pullRequestIsMature = updatedAt24hoursForward.diff(now, 'minutes') < 0;
  const pullRequestIsReadyToMerge = pullRequest.title.trim().startsWith(pullRequestReadyToMergePrefix);
  const pullRequestIsMergeable = pullRequest.mergeable;

  return pullRequestIsMature && pullRequestIsReadyToMerge && pullRequestIsMergeable;
}

const processPullRequest = async pullRequestsVoteResults => {
  const voteResult = {};

  for (const i in pullRequestsVoteResults) {
    const pullRequestVoteResult = pullRequestsVoteResults[i];
    if (pullRequestVoteResult >= 2) {
      await mergePullRequest(i);
      log(`Pull Request #${i} has been voted for merge.`);
    } else {
      log(`Pull Request #${i} has not been been voter to merge. Ignored.`);
    }
  }
};

module.exports = {
  run
};
