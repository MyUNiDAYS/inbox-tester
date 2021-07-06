var gmail = require("./gmail.js");

exports.findUrl = function(toPrefix, urlRegex) {
  return gmail
    .listMessageIds(toPrefix)
    .then(gmail.getMessages)
    .then(msgs => {
      var hits = msgs.map(msg => {
        var hrefRegex = /href="([^"]+)"/gi;
        var urls = [];
        var match;
        while ((match = hrefRegex.exec(msg.body)) !== null) urls.push(match[1]);

        var matches = urls.filter(u => urlRegex.exec(u));

        return {
          msgId: msg.id,
          to: msg.to,
          urls: matches
        };
      })
      .filter(h => h.urls.length);

      return hits;
    });
};

exports.deleteMessage = function(msgId) {
  return gmail.deleteMessage(msgId);
};
