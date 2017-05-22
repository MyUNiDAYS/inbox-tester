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

function listMessageIds(auth) {
	return new Promise(function(resolve, reject){
		var gmail = google.gmail('v1');
		gmail.users.messages.list({
			auth: auth,
			userId: 'me',
		}, function(err, response) {
			if (err) {
				console.log('The API returned an error: ' + err);
				reject(err);
				return;
			}
			
			var messages = response.messages;
			if (messages.length == 0) {
				resolve([]);
			} else {
				resolve(messages.map(m => m.id));
			}
		});
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
						
			for(var i = 0; i < response.payload.parts.length; i++)
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
	
	return to.subtr(0, ati);
}


exports.deleteMessage = function(id) {
	return auth.authorize.then(
		creds => deleteMessage(creds, id), 
		err => {
			console.log(err);
			return;
		});
};

exports.listMessageIds = function() {
	return auth.authorize.then(
		creds => listMessageIds(creds), 
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
