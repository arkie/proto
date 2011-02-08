keys = {65:'left', 68:'right', 87:'up', 83: 'down', 16:'attack'}

if (typeof(exports)=='undefined') exports = {}

exports.world = {}, list = [], types = {};

types.hero = function(id, data){
	this.type       = 'hero';
	this.id         = id;
	this.collisions = [];
	this.speed      = 5;
	this.left       = data.left   || false;
	this.right      = data.right  || false;
	this.up         = data.up     || false;
	this.attack     = data.attack || false;

	//Start position
	this.x = data.x || 100;
	this.y = data.y || 100; 
	this.draw = function(){
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillStyle = (this.collisions.length)?'#f00':'#000';
		ctx.fillRect(-10, -10, 20, 20);
		ctx.restore();
	}
	this.update = function(){
		speed = this.speed;
		if ((this.left||this.right)&&(this.up||this.down))
			speed = .7 * speed;
		if (this.left) this.x -= speed;
		if (this.right) this.x += speed;
		if (this.up) this.y -= speed;
		if (this.down) this.y += speed;
	}
	this.bounds = function(){
		return {left:this.x-10, top:this.y-10,
			right:this.x+10, bottom:this.y+10}
	}
}

exports.init = function(){
	setInterval(exports.main, 33);
}

exports.main = function (){
	if (typeof(ctx)!='undefined')
		ctx.clearRect(0, 0, cvs.width, cvs.height);
	for (var i = 0; i<list.length; i++){
		var o = exports.world[list[i]];
		var r1 = o.bounds()
		for (var ii = i+1; ii < list.length; ii++){
			var oo = exports.world[list[ii]];
			var r2 = oo.bounds()
			if (r1.top < r2.bottom && r2.top < r1.bottom &&
					r1.left < r2.right && r2.left < r1.right){
				o.collisions.push(oo);
				oo.collisions.push(o);
			}
		}
	}
	for (var o in exports.world){
		o = exports.world[o];
		o.update();
		if (typeof(ctx)!='undefined'){
			ctx.save();
			ctx.translate(cvs.width/2-player.x, cvs.height/2-player.y);
			o.draw();
			ctx.restore();
		}
		o.collisions = [];
	}
}

exports.receive = function(data){
	for (var k in data){
		if (k in exports.world){
			if (data[k] == 'delete'){
				for (i in list)
					if (list[i] == k){
					   	list.splice(i, 1);
						break;
					}
				delete exports.world[k];
			}
			else for (var v in data[k])
				exports.world[k][v] = data[k][v];
		} else if (data[k]['type']){
			exports.world[k] = new types[data[k]['type']](k, data[k]);
			list.push(k);
		}
	}
}

function send(id, data){
	socket.send(data);
	var env = {}; env[id] = data;
	exports.receive(env);
}

if (typeof(window)!='undefined'){
	window.onresize = function(){
		cvs.width  = window.innerWidth;
		cvs.height = window.innerHeight;
	}
	window.onload = function(){
		socket = new io.Socket(null, {port: 8080});
		socket.on('message', function(data){
			exports.receive(data);
		});
		socket.connect();

		cvs = document.getElementById('canvas');
		window.onresize();
		ctx = cvs.getContext('2d');

		send('@', {type:'hero'});
		player = exports.world['@'];
		window.onkeyup = window.onkeydown = function(e){
			var action = {}
			action = keys[e.keyCode];
			if (action){
				state = e.type == 'keydown';
				if (player[action] != state){
					env = {x:player.x, y:player.y}; env[action] = state;
					send('@', env);
				}
			}
		}
		exports.init();
	}
}