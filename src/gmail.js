var auth = require("./auth.js");
const {google} = require("googleapis");

const deleteMessage = (auth, id) => {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: "v1", auth: auth });
    gmail.users.messages.delete(
      {
        userId: "me",
        id: id
      },
      err => {
        if (err) {
          console.log("The API returned an error: " + err);
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

const listMessageIds = (auth, toPrefix) => {
  return new Promise(function(resolve, reject) {
    const pageResponseHandler = (response, messages) => {
      const result = messages.concat(response.data.messages || []);
      if (!response.data.nextPageToken || result.length >= 500) {
        resolve(result.map(m => m.id)); //Just return an array of ids, we don't care about the threadId
        return;
      }
      getPageOfMessages(
        buildRequest(response.data.nextPageToken),
        result
      );
    };

    const getPageOfMessages = (request, messages) => {
      const gmail = google.gmail({ version: "v1", auth: auth });
      gmail.users.messages.list(request, (err, response) => {
        if (err) {
          console.log("The API returned an error: " + err);
          reject(err);
          return;
        }
        pageResponseHandler(response, messages);
      });
    };

    const buildRequest = (pageToken = null) => {
      return {
        userId: "me",
        q: toPrefix ? "".concat("to:", toPrefix) : "newer_than:7d",
        pageToken: pageToken
      };
    };
    getPageOfMessages(buildRequest(), []);
  });
};

const getMessages = (auth, messageIds) => {
  return Promise.all(messageIds.map(id => getMessage(auth, id)));
};

const getMessage = (auth, id) => {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: "v1", auth: auth });
    gmail.users.messages.get(
      {
        userId: "me",
        id: id
      },
      (err, response) => {
        if (err) {
          console.log("The API returned an error: " + err);
          reject(err);
          return;
        }

        const payload = response.data.payload;
        var toHeaders = payload.headers.filter(h => h.name === "To");
        var to = toHeaders.length > 0 ? parseTo(toHeaders[0].value) : null;

        var numPayloadParts = payload.parts
          ? payload.parts.length
          : 0;
        for (var i = 0; i < numPayloadParts; i++) {
          var part = payload.parts[i];
          if (part.mimeType === "text/html" && part.body.data) {
            var buf = Buffer.from(part.body.data, "base64").toString("utf-8");
            resolve({
              id: id,
              to: to,
              body: buf
            });
            return;
          }
        }

        resolve({
          id: id,
          to: to,
          body: null
        });
      }
    );
  });
};

const parseTo = to => {
  var lti = to.indexOf("<");
  var ati = to.indexOf("@");

  if (lti > -1) return to.substring(lti + 1, ati);

  return to.substr(0, ati);
};

exports.deleteMessage = function(id) {
  return auth.authorize.then(
    creds => deleteMessage(creds, id),
    err => {
      console.log(err);
      return;
    }
  );
};

exports.listMessageIds = function(toPrefix) {
  return auth.authorize.then(
    creds => listMessageIds(creds, toPrefix),
    err => {
      console.log(err);
      return [];
    }
  );
};

exports.getMessages = function(messageIds) {
  return auth.authorize.then(
    creds => getMessages(creds, messageIds),
    err => {
      console.log(err);
      return [];
    }
  );
};
