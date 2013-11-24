
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require("socket.io");

var app = module.exports = express();

// all environments
app.configure(function() {
	app.set('port', process.env.PORT || 8000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function() {
	app.set('address', 'localhost');
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
	res.render('index', {
		title: 'ChatTok',
		address: app.settings.address,
		port: app.settings.port
	});
});
if (!module.parent) {
	app.listen(app.settings.port);
	console.log("server listening on port %d", app.settings.port);
}
app.get('/users', user.list);

/*http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/

require('./socketapp').start(io.listen(app));
