var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
var CLIENT_SECRET_PATH = 'client_secret.json';


var authorize = function() {
	return new Promise(function(resolve, reject){
		fs.readFile(CLIENT_SECRET_PATH, function processClientSecrets(err, content) {
			if (err)
				reject(err);
			else
			{
				var credentials = JSON.parse(content);
				
				var clientSecret = credentials.installed.client_secret;
				var clientId = credentials.installed.client_id;
				var redirectUrl = credentials.installed.redirect_uris[0];
				var auth = new googleAuth();
				var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

				// Check if we have previously stored a token.
				fs.readFile(TOKEN_PATH, function(err, token) {
					if (err) {
						getNewToken(oauth2Client, resolve);
					} else {
						oauth2Client.credentials = JSON.parse(token);
						resolve(oauth2Client);
					}
				});
			}
		});
	});	
}();


authorize.then(function(auth) {
	return listMessageIds(auth)
			.then(mids => { return getBodies(auth, mids); })
			.then(msgs => msgs.map(msg => {
				var urls = /href="([^"]+)"/gi.exec(msg.body);
				for(var j = 1; j < urls.length; j++)
					console.log(urls[j]);
			}));
});

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
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
}

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
