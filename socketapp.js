var opentok = require("opentok");
var ot = new opentok.OpenTokSDK('44462362', "d0a9753b870b4a6185ed8327fed6e25be1c9125b");

//check for chat partners
var notPartnered = [];

//sockets
exports.start = function(socket) {
	socket.on('connection', socketConnected);
}

var socketConnected = function(client) {
	client.on('message', function(message) {
		switch (message.event) {
			case 'initial':
				createSession(client);
				break;
			//user requests next
			case 'next':
				requestNew(client, socket);
				break;
		}
	});
}

var createSession = function(client) {
	ot.createSession('localhost', {}, function(session) {
		var data = {
			sessionId: session.sessionId,
			token: ot.generateToken({
				sessionId: session.sessionId,
				role: opentok.Roles.MODERATOR
			})
		}
		client.send({
			event: 'initial',
			data: data
		});
	});
}

var requestNew = function(client, socket) {
	var me = {
		sessionId: message.data.sessionId,
		clientId: client.sessionId
	};

	var partner, partnerClient;

	//look for user
	for(var i = 0; i < notPartnered.length; i++) {
		var temp = notPartnered[i];
		if(client.partner != temp) {
			partnerClient = socket.clientsIndex[temp.clientId];
			notPartnered.splice(i, 1);

			if (partnerClient) {
				partner = temp;
				break;
			}
		}
	}

	if(partner) {
		client.send({
			event:"subscribe",
			data: {
				sessionId: partner.sessionId,
				token: ot.generateToken({
					sessionId: partner.sessionId,
					role: opentok.Roles.SUBSCRIBER
				})
			}
		});

		partnerClient.send({
			event: "subscribe",
			data: {
				sessionId: me.sessionId,
				token: ot.generateToken({
					sessionId: me.sessionId,
					role:opentok.Roles.SUBSCRIBER
				})
			}
		});

		cliet.partner = partner;
		partnerClient.partner = me;

		client.inList = false;
		partnerClient.inList = false;
	} else {
		if (client.partner) {
			delete client.partner;
		}

		if (!client.inList) {
			client.inList = true;
			notPartnered.push(me);
		}

		client.send({
			event:'empty'
		});
	}
}