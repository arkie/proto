#!/usr/bin/env node
var http = require('http'),
	io   = require('socket.io');
	fs   = require('fs');

var cwd   = process.argv[1];
	cwd   = cwd.slice(0, cwd.lastIndexOf('/')+1);
var index = fs.readFileSync(cwd+'index.html')

fs.watchFile(cwd+'index.html', function(){
	fs.readFile(cwd+'index.html', function(e, data){index = data;})});

var user = process.argv[2], pass = process.argv[3]; //Fill in details here.

// Server

server = http.createServer(function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(index);
});
server.listen(8080);
var socket = io.listen(server);

// Twitter

var auth    = 'Basic ' + new Buffer(user + ':' + pass).toString('base64'),
	buf     = Buffer('');
//	log     = [];

var twitter = http.createClient(80, 'stream.twitter.com');
var stream  = function(url){
	twitter.request('GET', url,
		{'host':'stream.twitter.com', 'authorization':auth}
	).on('response', function(res){
		if (res.statusCode == 200)
			res.on('data', function(data){
				buf   += data;
				var cr = buf.indexOf('\n')+1;
				if (cr){
					data = buf.slice(0, cr);
					buf  = buf.slice(cr);
					data = JSON.parse(data);
					if (data.user){
						var message = {name:data.user.name,
							screen:data.user.screen_name,
							followers:data.user.followers_count,
							background:data.user.profile_background_color,
							image:data.user.profile_image_url};
						for (var url in data.entities.urls){
							url = data.entities.urls[url];
							uri = url.expanded_url || url.url;
							var slice = uri.indexOf('/', 8);
							var host  = uri.slice(7, slice);
							switch(host){
								case 'yfrog.com':
									message.media = {type:'image',
										source : uri+':iphone',
										thumb  : uri+':small',
										link   : uri};
									break;
								case 'twitpic.com':
									message.media = {type:'image',
									//	source : ['http://', host, '/show/full/',
										source : ['http://', host, '/show/large/',
											uri.slice(slice)].join(''),
										thumb  : ['http://', host, '/show/thumb/',
											uri.slice(slice)].join(''),
										link   : uri};
									break;
								case 'youtu.be':
									var youtube = uri.slice(16, uri.lastIndexOf('?'))
								case 'youtube.com':
								case 'www.youtube.com':
									if (!youtube && uri.indexOf('watch')+1)
										youtube = uri.slice(uri.indexOf('=')+1,
											uri.indexOf('&'));
									if (youtube)
										message.media = {type:'youtube',
											source : youtube,
											thumb  : ['http://img.youtube.com/vi/',
												youtube,'/1.jpg'].join(''),
											link   : uri};
									break;
//								default:
//									console.log('Missed:', uri);
//									break;
							}
							//TODO: Handle >1 url
							data.text = [data.text.slice(0, url.indices[0]),
								'<a href="', uri, '">', url.url, '</a>',
								data.text.slice(url.indices[1])
							].join('')
						}
						message.text = data.text;
//						if (log.length > 20)
//							log.shift();
//						log.push(message);
						socket.broadcast(message);
					}
				}
			})
		else console.log('Code:', res.statusCode)}
	).end()
};

stream('/1/statuses/sample.json');
//stream('/1/statuses/filter.json?track=yfrog,twitpic');
//stream('/1/statuses/filter.json?track=youtube');