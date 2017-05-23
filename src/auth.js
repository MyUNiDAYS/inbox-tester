var fs = require('fs');
var path = require('path');
var readline = require('readline');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/inbox-tester.json
var SCOPES = ['https://mail.google.com/'];
var TOKEN_DIR = path.join((process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE || process.cwd()), '.credentials');
var TOKEN_PATH = path.join(TOKEN_DIR,'inbox-tester.json');
var CLIENT_SECRET_PATH = path.resolve(__dirname + '/../client_secret.json');


exports.authorize = function() {
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

	console.log('Authorize this app by visiting this url:');
	console.log(authUrl);

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
		if (err.code != 'EEXIST')
			throw err;
	}
	
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	
	console.log('Token stored to ' + TOKEN_PATH);
}
