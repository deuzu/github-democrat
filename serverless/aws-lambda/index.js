const githubDemocrat = require('../bin');

exports.handler = (event, context, callback) => {
    try {
        githubDemocrat.run();

        callback(null);
    } catch (exception) {
        callback(exception);
    }
};
