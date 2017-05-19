var gmail = require('./gmail.js');
var express = require('express');


var app = express();

app.get('/emails/find-url', function(req, res){
	var to = req.query.to;
	var url = req.query.url;
	
	var urlRegex = new RegExp(url, 'ig');
	
	gmail.listMessageIds()
		.then(gmail.getBodies)
		.then(msgs => {
			var hits = msgs.map(msg => {

				var hrefRegex = /href="([^"]+)"/ig;
				
				var urls = [];
				
				var match;
				while ((match = hrefRegex.exec(msg.body)) !== null)
					urls.push(match[1]);
				
				var matches = urls.filter(u => urlRegex.exec(u));
				
				return {
					msgId: msg.id,
					urls: matches
				};
			});
			
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(hits));
		});
	
});

app.delete('/emails/:msgId', function(req, res){
	
	var id = req.params.msgId;
	
	gmail.deleteMessage(id)
		.then(function(){
			res.sendStatus(200);
		});
	
});

var server = app.listen(8080, function (){
	var host = server.address().address;
	var port = server.address().port;
	
	console.log('Listening on ' + host + ':' + port);
});