(function() {
	var socket = new io.Socket('localhost', {'port': 5454, rememberTransport:false});

	socket.on('connect', function() {
		socket.sent({event: 'initial'});
	});

	socket.on('message', function(message) {
		var sessionId, token;

		switch(message.event) {
			case 'initial':
				sessionId = message.data.sessionId;
				token = message.data.token;
				TokChat.init(sessionId, token);
				break;
			case 'subscribe':
				sessionId = message.data.sessionId;
				token = message.data.token;
				TokChat.subscribe(sessionId, token);
				break;
			case 'empty':
				TokChat.wait();
		}
	});

	socket.connect();

	var Proxy = function() {
		var findPartner = function(mySessId) {
			socket.send({
				event:'next',
				data: {
					sessionId: mySessId
				}
			});
		}
		return {
			findPartner: findPartner
		}
	}();

	var TokChat = function() {
		var apiKey = 44463262;
		var mySession;
		var partnerSession;

		var elements = {};

		TB.setLogLevel(TB.DEBUG);

		var init = function(sessionId, token) {
			elements.publisherContainer = document.getElementById("publisherContainer");
			elements.subscriberContainer = document.getElementById('subscriberContainer');
			elements.notificationContainer = document.getElementById("notificationContainer");
			elements.nextButton = document.getElementById("nextButton");
			elements.notificationContainer.innerHTML = "Connection Pending...";

			elements.nextButton.onclick = function() {
				TokChat.next();
			}
		

			mySession = TB.initSession(sessionId);
			mySession.addEventListener("sessionConnected", sessionConnectedHandler);
			mySession.addEventListener("connectionCreated", connectionCreatedHandler);
			mySession.addEventListener("connectionDestroyed", connectionDestoryedHandler);
			mySession.connect(apiKey, 'moderator_token');

			function sessionConnectedHandler(event) {
				elements.notificationContainer.innerHTML = "Connected...";
				var div = document.createElement('div');
				div.setAttribute('id', 'publisher');
				elements.addEventListener('accessAllowed', accessAllowedHandler);
			};

			function accessAllowedHandler(event) {
				Proxy.findPartner(mySession.sessionId);
			}

			function connectionCreatedHandler(event) {
				partnerConnection = event.connections[0];
			};

			function connectionDestroyedHandler(event) {
				partnerConnection = null;
			}
		}

		var next = function() {
			if (partnerConnection) {
				mySession.forceDisconnect(partnerConnection);
			}

			if (partnerSession) {
				partnerSession.disconnect();
			}
		};

		var subscribe = function(sessionId, token) {
			elements.notificationContainer.innerHTML = "Let's NOT have a sausage fest.";
			partnerSession = TB.initSession(sessionId);
			partnerSession.addEventListener('sessionConnected', sessionConnectedHandler);
			partnerSession.addEventListener('sessionDisconnected', sessionDisconnectedHandler);
			partnerSession.addEventListener("streamDestroyed", streamDestroyedHandler);

			partnerSession.connect(apiKey, token);
			function sessionConnectedHandler(event) {
				var div = document.createElement('div');
				elements.subscriberContainer.appendChild(div);
				partnerSession.subscribe(event.streams[0], div.id);
			}

			function sessionDisconnectedHandler(event) {
				partnerSession.removeEventListener('sessionConnected', sessionConnectedHandler);
				partnerSession.removeEventListener('sessionDisconnected', sessionDisconnectedHandler);
				partnerSession.removeEventListener('streamDestroyed', streamDestroyedHandler);

				Proxy.findPartner(mySession.sessionId);
				partnerSession = null;
			}

			function streamDestroyedHandler(event) {
				partnerSession.disconnect();
			}
		}

		var wait = function() {
			elements.notificationContainer.innerHTML = "No one likes you, bitch. Wait until someone cares.";
		};

		return {
			init: init,
			next: next,
			subscribe: subscribe,
			wait: wait
		}
	}()
	
})();