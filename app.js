
/**
 * Module dependencies.
 */

var express = require('express')
  , path = require('path')
  , twitter = require('ntwitter')
  , cb = require("couchbase")
  , app = express()
  , io = require('socket.io')
  , server = require('http').createServer(app)
  , io = io.listen(server)
  //, RedisDB = require('redis')
  //, redis = RedisDB.createClient(6379, 'localhost');
  , routes = require('./routes')
  , tweets = require('./routes/tweets')
  , common = require('./keys')
  , global_socket, global_stream, global_cb;


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](path.join(__dirname, 'public')));
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/stream', tweets.stream);
app.get('/stats', tweets.stats);


cb.connect(common.config, function( err, cb ){
	if( err ) {
    console.info("16");
    console.error(err);
  }else{
		global_cb = cb;
	}
});

var twit = new twitter({
  consumer_key: common.keys.consumer_key,
  consumer_secret: common.keys.consumer_secret,
  access_token_key: common.keys.access_token_key,
  access_token_secret: common.keys.access_token_secret 
});


function emitTweet(data){
  global_socket.emit('tweet', data);
}

function saveIntoCouchbase(aTweet, callback){

	myKey = aTweet.id_str;
	global_cb.set(myKey, JSON.stringify(aTweet), function (err, meta) {
		if(!err){
			callback(aTweet);
		}
	});

}


/* Socket.io config */
io.sockets.on('connection', function (socket) {
  global_socket = socket;
  
  // Set up events on socket
  // Start
  global_socket.on('start', function(socket) {
    twit.stream('statuses/sample', {"language": "es"},  function(stream) {
      global_stream = stream;
      stream.on('error', function(a,b){
				console.error(a);
				console.error(b);
			});
			stream.on('data', function (data) {
        saveIntoCouchbase(data, emitTweet);
      });
			
    });
  });

  // Stop
  global_socket.on('stop', function(socket) {
   global_stream.destroy();
  });
  
});


/* Run server  */
server.listen(3000);

