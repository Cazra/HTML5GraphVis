
//=======================================================================
// Sample Graph
//=======================================================================

var sampleGraph1 = {
	"version" : [0, 1],
	"id" : 0,
	"title" : "Sample Graph 1",
	"globalCoordinateInformation" : {
		"system" : "cartesian",
		"origin" : [0, 0],
		"originLocation" : "bottom-left",
		"width" : 1024,
		"height" : 1024,

	},
	"localCoordindateInformation" : {
		"origin" : [0, 0],
		"width" : 1024,
		"height" : 1024,
	},
	"nodes" : [
		{
			"id" : 0,
			"label" : "node-0",
			"coordinate" : [256.0, 256.0],
			"radius" : 20
		},
		{
			"id" : 1,
			"label" : "node-1",
			"coordinate" : [256.0, 768.0],
			"radius" : 20
		},
		{
			"id" : 2,
			"label" : "node-2",
			"coordinate" : [768.0, 768.0],
			"radius" : 20
		},
		{
			"id" : 3,
			"label" : "node-3",
			"coordinate" : [768.0, 256.0],
			"radius" : 20
		}
	],
	"edges" : [
		{
			"id" : 0,
			"label" : "edge-0",
			"srcNodeId" : 0,
			"dstNodeId" : 1
		},
		{
			"id" : 1,
			"label" : "edge-1",
			"srcNodeId" : 1,
			"dstNodeId" : 2
		},
		{
			"id" : 2,
			"label" : "edge-2",
			"srcNodeId" : 2,
			"dstNodeId" : 3,
		},
		{
			"id" : 3,
			"label" : "edge-3",
			"srcNodeId" : 3,
			"dstNodeId" : 0
		},
		{
			"id" : 4,
			"label" : "edge-4",
			"srcNodeId" : 0,
			"dstNodeId" : 2,
		},
		{
			"id" : 5,
			"label" : "edge-5",
			"srcNodeId" : 1,
			"dstNodeId" : 3,
		},
	]
};



//=======================================================================
// Random Graph Generator and Layout
//=======================================================================

function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.random = function() {
	return new Vector(Math.random(),Math.random());
}

Vector.prototype.add = function(v2) {
	return new Vector(this.x + v2.x, this.y + v2.y);
};

Vector.prototype.subtract = function(v2) {
	return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.multiply = function(n) {
	return new Vector(this.x * n, this.y * n);
};

Vector.prototype.divide = function(n) {
	return new Vector(this.x / n, this.y / n);
};

Vector.prototype.magnitude = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vector.prototype.normalise = function() {
	return this.divide(this.magnitude());
};

//Point.points = [];

function Point(id, position, mass) {	
	this.id = id;
	this.p = position; // position
	this.m = mass; // mass
	this.v = new Vector(0, 0); // velocity
	this.f = new Vector(0, 0); // force

	Point.points.push(this);
}


Point.prototype.applyForce = function(force) {
	this.f = this.f.add(force.divide(this.m));
};

// points are slightly repulsed by other points
Point.applyCoulombsLaw = function() {
	var ke = 100.0; // repulsion constant

	Point.points.forEach(function(point1) {
		Point.points.forEach(function(point2) {
			if (point1 !== point2) {
				var d = point1.p.subtract(point2.p);
				var distance = d.magnitude() + 1.0;
				var direction = d.normalise();

				// apply force to each end point
				point1.applyForce(direction.multiply(ke).divide(distance * distance * 0.5));
				point2.applyForce(direction.multiply(ke).divide(distance * distance * -0.5));
			}
		});
	});
};

Point.updateVelocity = function(timestep) {
	var damping = 0.5; // damping constant, points lose velocity over time
	Point.points.forEach(function(p) {
		p.v = p.v.add(p.f.multiply(timestep)).multiply(damping);
		p.f = new Vector(0,0);
	});
};

Point.updatePosition = function(timestep) {
	Point.points.forEach(function(p) {
		var temp = p.p.add(p.v.multiply(timestep));
		if (temp.x != NaN && temp.y != NaN) {
			p.p = temp;
		}
		//p.p = p.p.add(p.v.multiply(timestep));
	});
};


function Spring(id, point1, point2, length, k) {
	this.id = id;
	this.point1 = point1;
	this.point2 = point2;
	this.length = length; // spring length at rest
	this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is

	Spring.springs.push(this);
}

//Spring.springs = [];

Spring.applyHookesLaw = function() {
	Spring.springs.forEach(function(s) {
		var d = s.point2.p.subtract(s.point1.p); // the direction of the spring
		var displacement = s.length - d.magnitude();
		var direction = d.normalise();

		// apply force to each end point
		s.point1.applyForce(direction.multiply(s.k * displacement * -0.5));
		s.point2.applyForce(direction.multiply(s.k * displacement * 0.5));
	});
};


function randomGraph(nodeCount, connectivity) {
	Point.points = [];
	Spring.springs = [];

	for(i=0; i<nodeCount; i++) {
		var p = new Point(i, Vector.random(), 1.0);
	}
	
	edgeId = 0;
	for(i=0; i<Point.points.length-1; i++) {
		for(j=i+1; j<Point.points.length; j++) {
			if (Math.random() < connectivity) {
				new Spring(edgeId, Point.points[i], Point.points[j], 1.0, 500.0);
				edgeId++;
			}
		}
	}
	
	k = 1.0;
	iteration = 0;
	while (k > 0.01 && iteration < 10) { // iteration < 1000 k > 0.01
		Point.applyCoulombsLaw();
		Spring.applyHookesLaw();
		Point.updateVelocity(0.005);
		
		// Debug
		// Point.points.forEach(function(point) {
		// 	console.log('1>    ' + iteration + ': ' + point.id + ' --> ' + point.p.x + ',' + point.p.y);
		// });
		
		Point.updatePosition(0.005);
	
		// Debug
		// Point.points.forEach(function(point) {
		// 	console.log('2>    ' + iteration + ': ' + point.id + ' --> ' + point.p.x + ',' + point.p.y);
		// });
		
		// calculate kinetic energy of system
		var k = 0.0;
		Point.points.forEach(function(p){
			var speed = p.v.magnitude();
			k += speed * speed;
		});
		
		iteration++;
	}

	var minX = Number.MAX_VALUE;
	var minY = Number.MAX_VALUE;
	var maxX = Number.MIN_VALUE;
	var maxY = Number.MIN_VALUE;
	Point.points.forEach(function(p) {
		if (p.p.x < minX) minX = p.p.x;
		if (p.p.y < minY) minY = p.p.y;
		if (p.p.x > maxX) maxX = p.p.x;
		if (p.p.y > maxY) maxY = p.p.y;
	});
	var w = maxX - minX;
	var xScale = 1024 / w;
	var xShift = Math.abs(minX * xScale);
	var h = maxY - minY;
	var yScale = 1024 / h;
	var yShift = Math.abs(minY * yScale);
	
	// console.log(w + ", " + h);
	// console.log(xScale + ", " + yScale + '     ' + xShift + ', ' + yShift);
	
	var graph = {
		// Major and minor graph format version
		"version" : [0, 1],

		// Graph Id
		"id" : 0,

		// Graph Title
		"title" : "Random Graph",

		// Information about the graph data global coordinate system
		"globalCoordinateInformation" : {
			"system" : "cartesian",
			"origin" : [0, 0],
			"originLocation" : "bottom-left",
			"width" : 1024,
			"height" : 1024,

		},

		// Information about the graph data local coordinate system.  When a
		// subsection of a graph is requested, this will be the bounding box
		// for the graph response
		"localCoordindateInformation" : {
			"origin" : [0, 0],
			"width" : 1024,
			"height" : 1024,
		},

		// The array of nodes
		"nodes" : [],

		// The array of edges
		"edges" : []
	};

	Point.points.forEach(function(p) {
		var temp = {
			"id": p.id,
			"label": 'label-' + p.id,
			"coordinate": [ p.p.x * xScale + xShift, p.p.y * yScale + yShift]
		}
		graph.nodes.push(temp);
//		console.log("Node: " + p.id + ': ' + p.p.x + ',' + p.p.y);
	});

	Spring.springs.forEach(function(s) {
		var temp = {
			"id": s.id,
			"label": 'label-' + s.id,
			"srcNodeId": s.point1.id,
			"dstNodeId": s.point2.id
		}
		graph.edges.push(temp);
//		console.log("Edge: " + s.id + ': ' + s.point1.id + ' --> ' + s.point2.id);
	});
	
	return(graph);
}


//=======================================================================
// Server Implementation
//=======================================================================

var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;


function onRequest(request, response) {
	var urlObj = url.parse(request.url, true);
	
	var graphId = urlObj.query["graphId"];
	var nodeQuantity = urlObj.query["nodeQuantity"];
	var nodeConnectivity = urlObj.query["nodeConnectivity"];
	var callback = urlObj.query["callback"];
	var localX = urlObj.query["x"];
	var localY = urlObj.query["y"];
	var localW = urlObj.query["w"];
	var localH = urlObj.query["h"];
	
	console.log('IP: ' + request.connection.remoteAddress);
	console.log('\tGraphId: ' + graphId);
	console.log('\tNQ: ' + nodeQuantity);
	console.log('\tNC: ' + nodeConnectivity);
	console.log('callback: ' + callback);
	console.log('\tX: ' + localX);
	console.log('\tY: ' + localY);
	console.log('\tW: ' + localW)
	console.log('\tH:' + localH);
	console.log('callback: ' + callback);
	
	if (graphId == undefined) {
		respondError(response, 'Invalid parameter(s)');
	}
	else if (graphId == 'random' || graphId == 'cached') {
		var nq = 12;
		if (nodeQuantity != undefined) {
			nq = parseInt(nodeQuantity);
		}
		var nc = 0.25;
		if (nodeConnectivity != undefined) {
			nc = parseFloat(nodeConnectivity);
		}
		respondRandomGraphJSON(response, nq, nc, callback);
	}
	else if (graphId == 'cached') {
		if (nodeQuantity == undefined || nodeConnectivity == undefined) {
			respondError(response, 'nodeQuantity and nodeConnectivity must be provided in request');
		}
		else {
			var fileName = 'graph-' + nodeQuantity + '-' + nodeConnectivity + '.json.gz';
			var filePath = './graph-cache/' + fileName;
			if (!path.existsSync(filePath)) {
				respondError(response, 'cached graph file ' + fileName + ' does not exist');
			}
			else {
				responseGraphJSONFile(response, filePath, callback);
			}
		}
	}
	else {
		respondGraphJSON(response, callback);
	}
};

function respondError(response, msg) {
	response.writeHead(400, {"Content-Type" : "text/html"});
  	response.write('<html><body> ' + msg + ' </body></html>');
  	response.end();
}

function respondGraphJSON(response, callback) {
	response.writeHead(200, {"Content-Type" : "application/json"});
  	response.write(callback + "(" + JSON.stringify(sampleGraph1) + ")");
  	response.end();
}

function responseGraphJSONFile(response, filePath, callback) {
	response.writeHead(200, {"Content-Type" : "application/json"});
	
	var zcat = spawn('zcat', [ filePath ]);
	if(callback)
		response.write(callback + "(");
	zcat.stdout.on('data', function(data) {
		response.write(data);
	});
	
	zcat.stdout.on('end', function() {
		if(callback)
			response.write(")");
		response.end();
	});
}

function respondRandomGraphJSON(response, nodeQuantity, nodeConnectivity, callback) {
	var g = randomGraph(nodeQuantity, nodeConnectivity);
	response.writeHead(200, {"Content-Type" : "application/json"});
  	response.write(callback + "(" + JSON.stringify(g) + ")");
  	response.end();
}



function buildGraphCache(cachePath) {
	var sizes = [10, 100, 500, 1000, 5000, 10000];
	var connectivities = [0.2, 0.5, 0.8];
	
	if (!path.existsSync(cachePath)) {
		fs.mkdir(cachePath, 493); 
	}

	sizes.forEach(function(size) {
		connectivities.forEach(function(connectivity) {
			var graphPath = cachePath + '/graph-' + size + '-' + connectivity;
			if (!path.existsSync(graphPath)) {
				console.log('Creating cached graph: size=' + size + '  connectivity=' + connectivity);
				var graph = randomGraph(size, connectivity);
				fs.writeFileSync(graphPath, JSON.stringify(graph));				
			}
			else {
				console.log('Cached graph: size=' + size + '  connectivity=' + connectivity + ' already exists, skipping');
			}
		});
	});
}


//buildGraphCache('graph-cache');

http.createServer(onRequest).listen(8888);





