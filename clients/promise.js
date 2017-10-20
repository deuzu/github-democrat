const request = require('request');

module.exports = requestOptions => (
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

