var auth = require('./auth.js');
var google = require('googleapis');

// Docs: https://developers.google.com/gmail/api/v1/reference/users/messages

function deleteMessage(auth, id) {
	return new Promise(function(resolve, reject){
		var gmail = google.gmail('v1');
		gmail.users.messages.delete({
			auth: auth,
			userId: 'me',
			id: id
		}, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
				reject(err);
				return;
			}
			
			resolve();
		});
	});
};

function listMessageIds(auth, toPrefix) {
	return new Promise(function(resolve, reject){
		var gmail = google.gmail('v1');

		function pageResponseHandler(response,runningTotal){
			var thisRunningTotal = runningTotal;
			if(response.messages){
				thisRunningTotal = thisRunningTotal.concat(response.messages);
			}
			var nextPageToken = response.nextPageToken;
			if(nextPageToken){ //There's more to fetch
				var nextRequest = {
					auth: auth,
					userId: 'me',
					q: (toPrefix ? "".concat("to:",toPrefix,"%") : ""),
					pageToken: nextPageToken
				};
				getPageOfMessages(nextRequest,thisRunningTotal);
			} else { //There's no more to fetch
				if (thisRunningTotal.length == 0) {
					resolve([]);
				} else {
					resolve(thisRunningTotal.map(m => m.id)); //Just return an array of ids, we don't care about the threadId
				}
			}
		}

		function getPageOfMessages(thisRequest, runningTotal){
			gmail.users.messages.list(thisRequest,function(err,response){
				if (err) {
					console.log('The API returned an error: ' + err);
					reject(err);
					return;
				}
				pageResponseHandler(response,runningTotal);
			});
		};

		var initialRequest = {
			auth: auth,
			userId: 'me',
			q: (toPrefix ? "".concat("to:",toPrefix,"%") : ""),
		};
		getPageOfMessages(initialRequest,[]);
	});
};

function getMessages(auth, messageIds){
	return Promise.all(messageIds.map(id => getMessage(auth, id)));
}

function getMessage(auth, id){
    return new Promise((resolve, reject) => {
        var gmail = google.gmail('v1');
        gmail.users.messages.get({
            auth: auth,
            userId: 'me',
            id: id
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            
            var toHeaders = response.payload.headers.filter(h => h.name === 'To');
            var to = toHeaders.length > 0 ? parseTo(toHeaders[0].value) : null;
            
            var numPayloadParts = response.payload.parts ? response.payload.parts.length : 0;
            for(var i = 0; i < numPayloadParts; i++)
            {
                var part = response.payload.parts[i];
                if(part.mimeType == 'text/html') {
                    var buf = Buffer.from(part.body.data, 'base64').toString("utf-8");
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
			})
		});
	});
}

function parseTo(to){
	var lti = to.indexOf('<');
	var ati = to.indexOf('@');
	
	if(lti > -1)
		return to.substring(lti + 1, ati);
	
	return to.substr(0, ati);
}


exports.deleteMessage = function(id) {
	return auth.authorize.then(
		creds => deleteMessage(creds, id), 
		err => {
			console.log(err);
			return;
		});
};

exports.listMessageIds = function(toPrefix) {
	return auth.authorize.then(
		creds => listMessageIds(creds,toPrefix), 
		err => {
			console.log(err);
			return [];
		});
};

exports.getMessages = function(messageIds){
	return auth.authorize.then(
		creds => getMessages(creds, messageIds), 
		err => {
			console.log(err);
			return [];
		});
}
