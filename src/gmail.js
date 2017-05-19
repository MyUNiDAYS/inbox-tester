var auth = require('./auth.js');
var google = require('googleapis');

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

function getBodies(auth, messageIds){
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
			
			for(var i = 0; i < response.payload.parts.length; i++)
			{
				var part = response.payload.parts[i];
				if(part.mimeType == 'text/html') {
					var buf = Buffer.from(part.body.data, 'base64').toString("utf-8");
					resolve({
						id: id,
						body: buf
					});
					return;
				}
			}
			
			resolve({
				id: id,
				body: null
			})
		});
	});
}


exports.deleteMessage = function(id) {
	return auth.authorize.then(
		creds => deleteMessage(creds, id), 
		err => {
			console.log(err);
			return [];
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

exports.getBodies = function(messageIds){
	return auth.authorize.then(
		creds => getBodies(creds, messageIds), 
		err => {
			console.log(err);
			return [];
		});
}
