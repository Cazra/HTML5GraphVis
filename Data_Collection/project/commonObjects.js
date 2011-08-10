
/* *
 * camera object
 * written by: Stephen Lindberg
 * Created: 6/28/11
 * Last modified: 7/18/11 by Stephen Lindberg
 * 
 * For SVG: Your SVG document must have a group with the ID "cameraGroup". All Camera operations will be 
 * 		applied to this group.
 * For Canvas: All Camera operations must be applied before drawing shapes to the canvas.
 * 
 * Order of transformations (in terms of matrix multiplication, which are done from right to left): 
 * 		CurrentTranslateMatrix = Translate * Scale * InvertY * View
 * */

/* *
 * Constructor
 * Inputs: painter is the root of our painting DOM. svgDocument for SVG. CanvasRenderingContext2D object for Canvas.
 * 		If no painter or an invalid painter is given, then the camera's drawing methods will be disabled.
 * */

function Camera(painter, typeStr)
{
	// member variables
	
	this.centerX = 0;
	this.centerY = 0;
	this.zoom = 1.0;
	this.invertedY = 0;
	this.painter = painter;
	this.needsRedraw = true;
	
	this.width;
	this.height;
	this.left;
	this.right;
	this.top;
	this.bottom;
	this.viewWidth;
	this.viewHeight;
	
	this.mouseX = 0;
	this.mouseY = 0;
	
	// painter-independent methods
	
	this.zoomToFit = cameraZoomToFit;
	
	// painter-dependent methods

	if(typeStr == "SVG") // for some reason every web browser except Firefox has problems correctly identifying SVGDocuments.
	{
		this.cameraGroup = painter.getElementById("cameraGroup");
		this.width = painter.documentElement.getAttribute("width");
		this.height = painter.documentElement.getAttribute("height");
		
		this.moveTo = cameraMoveToSVG;
		this.setInvertedY = cameraInvYSVG;
		this.zoomTo = cameraZoomSVG;
		this.updateCTM = __cameraUpdateCTMSVG;
		this.updateMouse = cameraUpdateMouse;
		this.worldToCanvas = cameraWorldToCanvas;
		
		// set initial transforms and move center of camera to origin.
		this.viewStr = "translate(" + (this.width/2) + "," + (this.height/2) + ") ";
		this.scaleStr = "scale(" + 1.0 + ") ";
		this.invYStr = "scale(" + 1.0 +  ") ";
		this.moveTo(0,0);
		

	}
	else if(painter instanceof CanvasRenderingContext2D)
	{
		this.width = painter.canvas.width;
		this.height = painter.canvas.height;
		
		this.moveTo = cameraMoveToCanvas;
		this.setInvertedY = cameraInvYCanvas;
		this.zoomTo = cameraZoomCanvas;
		this.updateCTM = __cameraUpdateCTMCanvas;
		this.updateMouse = cameraUpdateMouse;
		this.worldToCanvas = cameraWorldToCanvas;
		
		this.moveTo(0,0);
		
		
	}
	else if(painter instanceof Array) // array of CanvasRenderingContex2D objects (assumed to be same size)
	{
		this.width = painter[0].canvas.width;
		this.height = painter[0].canvas.height;
		
		this.moveTo = cameraMoveToCanvas;
		this.setInvertedY = cameraInvYCanvas;
		this.zoomTo = cameraZoomCanvas;
		this.updateCTM = __cameraUpdateCTMCanvasArr;
		this.updateMouse = cameraUpdateMouse;
		this.worldToCanvas = cameraWorldToCanvas;
		
		this.moveTo(0,0);
		
		
	}
	else if(typeStr == "Protovis")
	{
		this.cameraGroup = painter.transform;
	//	alert(JSON.stringify(painter.transform));
		this.width = 640;
		this.height = 480;
		
		this.moveTo = cameraMoveToPV;
		this.zoomTo = cameraZoomPV;
		this.updateCTM = __cameraUpdateCTMPV;
		this.updateMouse = cameraUpdateMouse;
		this.worldToCanvas = cameraWorldToCanvas;
	}
	else
	{
		alert("Caution: This camera doesn't have a painter.");
		
	}
	
}


/* *
 * __cameraUpdateCTMCanvas
 * Helper method for updating the Current Transform Matrix in Canvas.
 * Postconditions: Builds the canvas's Current Transform Matrix from the most recent camera operations.
 * */

function __cameraUpdateCTMCanvas()
{
	this.painter.setTransform(1,0,0,1,0,0);
	
	// move center of camera to origin using the view transformation.
	this.painter.translate(this.width/2, this.height/2);
	
	// apply the invertedY transformation if needed.
	if(this.invertedY)
		this.painter.scale(1.0,-1.0);
		
	// apply the zoom transformation
	this.painter.scale(this.zoom,this.zoom);
	
	// apply the pan transformation
	this.painter.translate(0-this.centerX, 0-this.centerY);
	
	this.needsRedraw = true;

	
}

/* *
 * __cameraUpdateCTMCanvasArr
 * Helper method for updating the Current Transform Matrix in Canvas.
 * Postconditions: Builds the canvas's Current Transform Matrix from the most recent camera operations.
 * */

function __cameraUpdateCTMCanvasArr()
{
	var i;
	for(i in this.painter)
	{
		this.painter[i].setTransform(1,0,0,1,0,0);
		
		// move center of camera to origin using the view transformation.
		this.painter[i].translate(this.width/2, this.height/2);
		
		// apply the invertedY transformation if needed.
		if(this.invertedY)
			this.painter[i].scale(1.0,-1.0);
			
		// apply the zoom transformation
		this.painter[i].scale(this.zoom,this.zoom);
		
		// apply the pan transformation
		this.painter[i].translate(0-this.centerX, 0-this.centerY);
	}

	this.needsRedraw = true;
}

/* *
 * __cameraUpdateCTMSVG
 * Helper method for updating the Current Transform Matrix in SVG.
 * Postconditions: cameraGroup's transform is updated with the most recent camera operations.
 * */

function __cameraUpdateCTMSVG()
{
	this.needsRedraw = true;
	this.cameraGroup.setAttributeNS(null, "transform",  this.viewStr + this.invYStr + this.scaleStr + this.translateStr);
}

/* *
 * __cameraUpdateCTMPV
 * Helper method for updating the Current Transform Matrix in Protovis.
 * Postconditions: cameraGroup's transform is updated with the most recent camera operations.
 * */

function __cameraUpdateCTMPV()
{
	this.needsRedraw = true;
//	this.painter.transform(pv.Transform.identity.translate((this.viewWidth-this.width)/2,(this.viewHeight-this.height)/2));
	this.painter.transform(pv.Transform.identity
										.translate(this.width/2,this.height/2) // move origin to center of screen
										.scale(this.zoom) // zoom
										.translate((this.viewWidth-this.width)/2,(this.viewHeight-this.height)/2) // move camera to compensate for Protovis handling camera centering weirdly
										.translate(0-this.centerX, 0-this.centerY) // look at wherever the camera center currently is
									);

}


/* *
 * cameraMoveToCanvas
 * Moves the camera in Canvas.
 * Inputs: x,y define the new center coordinate for the camera to focus on.
 * Postconditions: the camera is moved.
 * */

function cameraMoveToCanvas(x, y)
{
	this.centerX = x;
	this.centerY = y;
	
	this.updateCTM();
}

/* *
 * cameraMoveToSVG
 * Moves the camera in SVG.
 * Inputs: x,y define the new center coordinate for the camera to focus on.
 * Postconditions: the camera is moved.
 * */

function cameraMoveToSVG(x, y)
{
	this.centerX = x;
	this.centerY = y;
	
	this.translateStr = "translate(" + (0 - x) + "," + (0 - y) + ") ";
	
	this.updateCTM();
}

/* *
 * cameraMoveToPV
 * Moves the camera in Canvas.
 * Inputs: x,y define the new center coordinate for the camera to focus on.
 * Postconditions: the camera is moved.
 * */

function cameraMoveToPV(x, y)
{
	this.centerX = x;
	this.centerY = y;

	this.updateCTM();
}

/* *
 * cameraInvYCanvas
 * Sets whether or not the y axis is inverted in Canvas.
 * Inputs: inverted is a boolean value.
 * Postconditions: If inverted is true, then the y-axis of the Canvas will be inverted. 
 * 		If inverted is false, then the y-axis of the Canvas will uninverted.
 * */

function cameraInvYCanvas(inverted)
{
	var temp = 0;
	if(inverted)
		temp = 1;
	if(this.invertedY != temp)
	{
		this.invertedY = 1 - this.invertedY;
		this.updateCTM();
	}
}

/* *
 * cameraInvYSVG
 * Sets whether or not the y axis is inverted in SVG.
 * Inputs: inverted is a boolean value.
 * Postconditions: If inverted is true, then the y-axis of cameraGroup will be inverted. 
 * 		If inverted is false, then the y-axis of cameraGroup will uninverted.
 * */

function cameraInvYSVG(inverted)
{
	if(inverted)
		this.invYStr = "matrix(1,0,0,-1,0,0)";
	else
		this.invYStr = "scale(" + 1.0 + ") ";
		
	this.updateCTM();
}

/* *
 * cameraZoomCanvas
 * Sets the zoom for the camera in Canvas.
 * Inputs: zoom is the zoom setting we want for our camera. 1.0 uses no zoom. 
 * 		Less than 1.0 will zoom out. Greater than 1.0 will zoom in.
 * Postconditions: The camera's zoom setting is changed.
 * */

function cameraZoomCanvas(zoom)
{
	this.zoom = zoom;
	this.updateCTM();
}

/* *
 * cameraZoomSVG
 * Sets the zoom for the camera in SVG.
 * Inputs: zoom is the zoom setting we want for our camera. 1.0 uses no zoom. 
 * 		Less than 1.0 will zoom out. Greater than 1.0 will zoom in.
 * Postconditions: The camera's zoom setting is changed.
 * */

function cameraZoomSVG(zoom)
{
	this.scaleStr = "scale(" + zoom + ") ";
	this.zoom = zoom;
	
	this.updateCTM();
}

/* *
 * cameraZoomPV
 * Sets the zoom for the camera in Canvas.
 * Inputs: zoom is the zoom setting we want for our camera. 1.0 uses no zoom. 
 * 		Less than 1.0 will zoom out. Greater than 1.0 will zoom in.
 * Postconditions: The camera's zoom setting is changed.
 * */

function cameraZoomPV(zoom)
{
	this.zoom = zoom;
	this.updateCTM();
}

/* *
 * cameraUpdateMouse
 * Records the position of the mouse in the Canvas's World coordinates.
 * Inputs: x,y is the mouse's position in Canvas coordinates (the x,y distance of the mouse
 * 		from the top-left corner of the Camera's Canvas element).
 * Postconditions: The mouse's World coordinates are updated and are available 
 * 		through Camera members mouseX and mouseY. It also updates the World coordinates of 
 * 		the Canvas's boundaries in members left, right, top, and bottom.
 * */
 
 function cameraUpdateMouse(x,y)
 {
	var mUnitX = x/this.width;
	var mUnitY = y/this.height;
	
	this.left = this.centerX - this.width/this.zoom/2;
	this.right = this.centerX + this.width/this.zoom/2;
	this.top = this.centerY - this.height/this.zoom/2;
	this.bottom = this.centerY + this.height/this.zoom/2;
	
//	alert("(" + this.left + "," + this.top + ") (" + this.right + "," + this.bottom + ")"); 
	
	this.mouseX = (1 - mUnitX)*this.left + mUnitX*this.right;
	this.mouseY = (1 - mUnitY)*this.top + mUnitY*this.bottom;
 }
 
 
 /* *
 * cameraWorldToCanvas
 * Converts the World coordinates of an object to Camera coordinates.
 * Inputs: x,y is are some object's World coordinates.
 * Postconditions: Returns an array containing input World coordinates transformed into Canvas coordinates.
 * */
 
 function cameraWorldToCanvas(x,y)
 {
//	alert("(" + this.left + "," + this.top + ") (" + this.right + "," + this.bottom + ")"); 
	 
	var unitX = (x - this.left)/(this.right - this.left);
	var unitY = (y - this.top)/(this.bottom - this.top);
	
//	alert(unitX + "," + unitY);
	
	return [unitX*this.width, unitY*this.height];
 }
 
/* *
* cameraZoomToFit
* Repositions and zooms the Camera to fit the painter object.
* Postconditions: The camera is centered at the center of the painter object and it is zoomed out 
* 		so that the Camera's borders are at the painter object's borders.
* */

function cameraZoomToFit()
{
	this.moveTo(this.viewWidth/2,this.viewHeight/2);
	
	var zoomScale;
	var cameraAspect = this.width / this.height;
	var painterAspect = this.viewWidth / this.viewHeight;
	
	
	if(cameraAspect >= painterAspect)
		zoomScale = this.height / this.viewHeight;
	else
		zoomScale = this.width / this.viewWidth;

	this.zoomTo(zoomScale);
}
 
/* *
 * graph object
 * written by: Stephen Lindberg
 * Created: 6/22/11
 * Last modified: 7/28/11 by Stephen Lindberg
 * 
 * If the JSON reader is used, then the document using this js file must import jQuery.
 * Documents using the Canvas constructor should import magicPen.js.
 * SVG Documents don't need to import anything else.
 * */

/* *
 * Constructor
 * Inputs: painter is the root of our painting DOM. svgDocument for SVG. Something else for Canvas.
 * 		If no painter or an invalid painter is given, then the graph's painting methods will be disabled.
 * */

function Graph(painter, typeStr)
{
	// member variables
	
	this.nodes = new Array();
	this.highlighted = new Array();
	this.numNodes = 0;
	this.numEdges = 0;
	this.painter = painter;
	this.typeStr = typeStr;
	this.jsonReady = false;
	this.jsonData = null;
	
	// private members
	
	this.drawnEdges;
	this.idMap;
	this.idMapRes;
	
	// painter-independent methods
	
	this.addNode = graphAddNode;
	this.addEdge = graphAddEdge;
	this.readJSON = graphReadJSON;
	this.unhighlightAll = graphUnhighlightAll;
	this.destroy = graphDestroy;
	
	// painter-dependent methods
	
	if(painter instanceof SVGDocument || typeStr == "SVG") // for some reason every web browser except Firefox has problems correctly identifying SVGDocuments.
	{
		this.draw = graphDrawSVG;
		this.drawToolTip = graphToolTipSVG;
		this.eraseToolTip = graphEraseToolTipSVG;
		this.highlightFX = graphHighlightFXSVG;
		this.drawNode = drawNodeSVG;
		this.numDrawnEdges = 0;
	}
	else if(painter instanceof HTMLDocument)
	{
		this.draw = graphDrawCanvas;
		this.drawToolTip = graphToolTipCanvas;
//		this.eraseToolTip = graphEraseToolTipCanvas;
		this.highlightFX = graphHighlightFXCanvas;
		this.drawNode = drawNodeCanvas;
		this.drawNodeToIDMap = drawNodeToIDMap;
		this.drawEdges = drawEdgesCanvas;
		this.getMouseNode = graphGetMouseNode;
		
		this.nodePen = painter.getElementById("nodeGroup").getContext("2d");
		this.edgePen = painter.getElementById("edgeGroup").getContext("2d");
		this.drawnEdges = new Array();
		this.needsRedraw = true;
		
	}
	else if(typeStr == "Protovis")
	{
		this.draw = graphDrawPV;
	//	this.drawToolTip = graphTooTipPV;
//		this.eraseToolTip = graphEraseToolTipPV;
		this.highlightFX = graphHighlightFXPV;
		this.drawnEdges = [];
		this.numDrawnEdges = 0;
		
	}
	else
	{
		alert("Caution: This graph doesn't have an appropriate painter.");
		this.addNode = graphAddNode2;
		this.draw = null;
		this.drawToolTip = null;
		this.eraseToolTip = null;
		this.highlightFX = null;
	}
	
	
}

/* *
 * graphDestroy
 * Destructor
 * */

function graphDestroy()
{
	var i;
	for(i in this.nodes)
	{
		this.nodes[i].destroy();
	}
	this.pvJSONedges = null;
	this.nodes = null;
	this.drawnEdges = null;
	this.highlighted = null;
	this.painter = null;
	this.jsonData = null;
	this.idMap = null;
	this.nodePen = null;
	this.edgePen = null;
}

/* *
* graphReadJSON
* Constructs the graph using data from an external JSON file returned by the graph layout server.
* Inputs: A prompt asks the user how many nodes the graph should have.
* Postcondition: The graph is constructed from the JSON data returned from the server.
* */

function graphReadJSON(timers,numNodes,connectivity)
{
	// set up timer pointers
	
	var drawTimer = null;
	var serverTimer = null;
	
	if(timers instanceof Array)
	{
		drawTimer = timers[0];
		serverTimer = timers[1];
	}
	else
	{
		drawTimer = timers;
	}
	
	// start the server processing timer
	
	if(serverTimer)
		serverTimer.start();
	
	// set up the server url string and append input for our graph.
	//graphId=cached
	var dataurl = "http://localhost:8888/?graphId=cached&nodeQuantity=" + numNodes + "&nodeConnectivity=" + connectivity + "&callback=?";
	
	// this graph is not ready yet.
	
	this.jsonReady = false;
	
	// get a pointer for our graph so we can manipulate it in the JSON callback function.
	
	var thisgraph = this;
	
	// set up default error message for ajax communication
	
	jQuery.ajaxSetup(
	{
		error: ajaxError
	});
	
	// send our input data to the graph generator server and process the response in a callback function.

	jQuery.getJSON(dataurl,{}, function(data)
	{
		// Create the graph's nodes
		
		var nodes = data.nodes;
		var edges = data.edges;
		
		jQuery.each(nodes,function(nodNum,node)
		{
			if(node.id == 0)	// nodes with id 0 will be prevented from being drawn to the ID map in Canvas. So let's change its id just slightly.
				node.id = "0";
			thisgraph.addNode(node.coordinate[0],node.coordinate[1],node.id,node.label);
			
		//	if(node.coordinate[0] == null)
		//		alert(node.id + " " + node.label + " " + node.coordinate[0] + " " + node.coordinate[1]); 
		});
		
		// Create the graph's edges
		
		jQuery.each(edges,function(edgeNum, edge)
		{
			if(edge.id == 0)
				edge.id = "0";
			if(edge.srcNodeId == 0)
				edge.srcNodeId = "0";
			if(edge.dstNodeId == 0)
				edge.dstNodeId = "0";
			
			thisgraph.addEdge(edge.srcNodeId, edge.dstNodeId);
		});
		
		// retain the JSON data in this graph object.
		
		thisgraph.jsonData = data;
		thisgraph.jsonReady = true;
		
		// start the initial rendering timer and pause the server timer
		
		drawTimer.start();
		if(serverTimer)
			serverTimer.pause();
			
		// avoid memory leaks
		data = null;
		thisgraph = null;
		drawTimer = null;
		serverTimer = null;
		nodes = null;
		edges = null;
		dataurl = null;
		timers = null;
		numNodes = null;
		connectivity = null;
	});

	this.needsRedraw = true;
	
}

	function ajaxError(xhr, status, error)
	{
		alert("xhr: " + JSON.stringify(xhr) + "\nerror: " + error + "\nstatus:" + xhr.status);
	}

/* *
 * graphAddNode
 * Adds a node to the graph.
 * Inputs: x is the node's x coordinate for rendering. y is its y coordinate for rendering.
 * 		id is a unique id assigned to this node.
 * Postconditions: A node uniquely identified by id is created in the graph.
 * */

function graphAddNode(x,y,id, label)
{
	if(!this.nodes[id])
	{
		var myNode = new Node(x,y,id, label);
		this.nodes[id] = myNode;
		this.highlighted[id] = 0;
		this.numNodes++;
		this.needsRedraw = true;
	}
}

/* *
 * graphAddNode2
 * Adds a node to the graph if the graph is not renderable.
 * Inputs: id is a unique id assigned to this node.
 * Postconditions: A node uniquely identified by id is created in the graph.
 * */

function graphAddNode2(id, label)
{
	if(!this.nodes[id])
	{
		var myNode = new Node(0,0,id, label);
		this.nodes[id] = myNode;
		this.numNodes++;
	}
}

/* *
 * graphAddEdge
 * Creates a bidirectional edge between two nodes in the graph.
 * Inputs: id1 and id2 are the ids of the nodes we are connecting with an edge.
 * Postconditions: An edge is created connecting nodes id1 and id2.
 * */

function graphAddEdge(id1, id2)
{
	var node1 = this.nodes[id1];
	var node2 = this.nodes[id2];
	
	if(node1 && node2)
	{
		node1.addEdge(node2);
		this.numEdges++;
		this.needsRedraw = true;
	}
}

/* *
 * graphDrawSVG
 * Draws the graph in an SVG Document
 * Preconditions: The graph assumes that its SVG Document has group elements with 
 * 		ids "edgeGroup" and "nodeGroup" (created in that order).
 * Postconditions: The graph is drawn in its SVG Document.
 * */

function graphDrawSVG()
{
	// private helper method draws a node object
	
	this.nodesGroupSVG = this.painter.createElementNS("http://www.w3.org/2000/svg", "g");
	this.painter.getElementById("nodeGroup").appendChild(this.nodesGroupSVG);
	
	this.edgesGroupSVG = this.painter.createElementNS("http://www.w3.org/2000/svg", "g");
	this.painter.getElementById("edgeGroup").appendChild(this.edgesGroupSVG);
	
	// loop through each node to draw the graph.
	
	var i;
	for(i in this.nodes)
	{
		var myNode = this.nodes[i];
		this.drawNode(myNode);
	}
	
}


/* *
 * graphDrawPV
 * 
 * */

/* *
 * drawNodeSVG private method for graphDrawSVG
 * Draws a node and its edges.
 * Inputs: node is the node we're drawing.
 * Postconditions: The node and its edges are drawn onto this graph's SVG document.
 * */

	function drawNodeSVG(node) 
	{
		var svgDoc = this.painter;
		
		// draw this node
		
		var nodeSprite = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.nodesGroupSVG.appendChild(nodeSprite);
		nodeSprite.id = node.id;
		nodeSprite.setAttribute("cx",node.x);
		nodeSprite.setAttribute("cy",node.y);
		
		var nodeidOuter = node.id;
		nodeSprite.onmouseover = function(evt)
		{
			var nodeid = nodeidOuter;
			svgDoc.drawToolTip(nodeid);
		};
		nodeSprite.onmouseout = function(evt)
		{	
			var nodeid = nodeidOuter;
			svgDoc.eraseToolTip(nodeid);
		};
		nodeSprite.onclick = function(evt)
		{	
			var nodeid = nodeidOuter;
			svgDoc.highlightFX(nodeid);
		};
		nodeSprite.setAttributeNS(null, "r", "20");
		nodeSprite.setAttributeNS(null, "style", "fill:#00AAFF;stroke:#000000;stroke-width:3;shape-rendering:optimizeSpeed;pointer-events:visibleFill");
	
		// draw the edges for this node
		
		var i;
		for(i in node.edges)
		{
			
			var other = node.edges[i]; 
			
			if(!node.drawnEdges[i])
			{
				var edgeShape = svgDoc.createElementNS("http://www.w3.org/2000/svg", "line");
				this.edgesGroupSVG.appendChild(edgeShape);
				edgeShape.setAttributeNS(null, "x1", node.x);
				edgeShape.setAttributeNS(null, "y1", node.y);
				edgeShape.setAttributeNS(null, "x2", other.x);
				edgeShape.setAttributeNS(null, "y2", other.y);
				edgeShape.setAttributeNS(null, "style", "stroke:#000000;stroke-width:3;shape-rendering:optimizeSpeed;pointer-events:visibleFill");

				
				node.edgeSprites[other.id] = edgeShape;
				other.edgeSprites[node.id] = edgeShape;
				edgeShape = null;
				
				// set drawn edge flags to true so they don't get drawn twice.
				
				node.drawnEdges[i] = true;
				other.drawnEdges[node.id] = true;
				this.numDrawnEdges++;
			}
		}
		
		// prevent memory leaks
		node = null;
		nodeSprite = null; 
	}

/* *
 * graphDrawCanvas
 * Draws the graph in a Canvas Document
 * Inputs: camera is a Camera object with this graph's pens bound to it.
 * Preconditions: The graph assumes that its Document has canvas elements with 
 * 		ids "edgeGroup" and "nodeGroup" (created in that order).
 * Postconditions: The graph is drawn in the edgeGroup and nodeGroup canvases.
 * */
 
function graphDrawCanvas(camera)
{
	var nodePen = this.nodePen;
	var edgePen = this.edgePen;
	nodePen.lineWidth = 3;
	edgePen.lineWidth = 3;
	
	/* *
	* set up the node ID map which will function like a Canvas that uses node IDs as colors.
	* idMapRes will control the resolution of the ID map. The drawings for the ID map do not have to be 
	* high quality, so we'll set it at low resolution. 
	* 
	* idMapRes = 1 sets its resolution equal to the Canvas's resolution.
	* idMapRes > 1 lowers the resolution.
	* */

	this.idMapRes = 5; 
	this.idMap = new Array();
	var i;
	for(i = 0; i < (this.nodePen.canvas.width / this.idMapRes) + 1; i++)
	{
		this.idMap[i] = new Array();
	}
	
	// loop through each node to draw the graph
	
	var i;
	for(i in this.nodes) 
	{
		var myNode = this.nodes[i];
		this.drawNode(myNode,camera);
	}
	
	edgePen.strokeStyle = "#000000";
	edgePen.miterLimit = 4; // equal to SVG's initial miter limit value
	//edgePen.beginPath(); // uncomment this line for Firefox optimization. Comment it out for Chrome optimization.
	this.numDrawnEdges = 1;
	for(i in this.nodes) 
	{
		var myNode = this.nodes[i];
		this.drawEdges(myNode);
	}
	//edgePen.stroke(); // uncomment this line for Firefox optimization. Comment it out for Chrome optimization.

	
	// reset the drawnEdges array for the next time the draw method is called.
	
	this.drawnEdges = new Array();
	
	this.needsRedraw = false;
}

/* *
 * drawNodeCanvas private method for graphDrawCanvas
 * Draws a node and its edges.
 * Inputs: node is the node we're drawing, camera is the prototype's camera.
 * Postconditions: The node and its edges are drawn onto this graph's canvas and onto the ID Map.
 * */
	
	function drawNodeCanvas(node,camera) // private helper method draws a node object
	{
		var nodePen = this.nodePen;
		var edgePen = this.edgePen;
		
		// draw this node
		
		if(graph.highlighted[node.id])
		{
			mpCircle(nodePen, node.x, node.y, 20, "#AA5500", "#CCCC00");
		}
		else
		{
			mpCircle(nodePen, node.x, node.y, 20, "#000000", "#00AAFF");
		}
		
		
		// Draw the node onto the ID map
		this.drawNodeToIDMap(node,camera);
		
		
	}
	
			/* *
			* drawNodeToIDMap
			* helper helper method for drawing a node to the ID map for Canvas interactivity.
			* Inputs: node is the node we're drawing, camera is this prototype's camera.
			* Postconditions: The node is drawn onto the ID Map unless it is chosen to be clipped.
			* */
			
			function drawNodeToIDMap(node,camera)
			{
				if(node.x + 20 >= camera.left && node.x -20 <= camera.right && node.y + 20 >= camera.top && node.y - 20 <= camera.bottom)
				{
					// this node isn't clipped from the ID map.
					
					// determine the bounding box of where we're drawing the node in the ID map.
					var nodeT = camera.worldToCanvas(node.x,node.y);
					var nodeTX = nodeT[0] / this.idMapRes;
					var nodeTY = nodeT[1] / this.idMapRes;
					var nodeTR = camera.zoom*20 / this.idMapRes;
					
					var leftClip = Math.floor(Math.max(nodeTX - nodeTR,0));
					var rightClip = Math.floor(Math.min(nodeTX + nodeTR, camera.width / this.idMapRes));
					var topClip = Math.floor(Math.max(nodeTY - nodeTR,0));
					var bottomClip = Math.floor(Math.min(nodeTY + nodeTR, camera.height / this.idMapRes));
					
					// draw the node in the ID map in the area determined by our clipping edges.
					var i;
					var j;
					
					for(i = leftClip; i < rightClip; i++)
					{
						for(j = topClip; j <bottomClip; j++)
						{
							var sqrDist = (nodeTX - i) * (nodeTX - i) + (nodeTY - j) * (nodeTY - j);
							if(sqrDist <= nodeTR * nodeTR)
							{
								this.idMap[i][j] = node.id;
							}
						}
					}
					
				}
				else
				{
				//	alert("node " + node.id + " was clipped from ID map.");
				}
			}


/* *
 * drawEdgesCanvas private method for graphDrawCanvas
 * Draws a node and its edges.
 * Inputs: node is the node we're drawing, camera is the prototype's camera.
 * Postconditions: The node and its edges are drawn onto this graph's canvas and onto the ID Map.
 * */
	
	function drawEdgesCanvas(node) // private helper method draws edges for a node object
	{
		var edgePen = this.edgePen;

		// draw the edges for this node
		var i;
		
		for(i in node.edges)
		{
			var other = node.edges[i]; 
			
			if(!this.drawnEdges[i + "," + node.id])
			{
			//	mpLine(edgePen, node.x, node.y, other.x, other.y, "#000000");
				edgePen.beginPath(); // comment this line out for Firefox optimization. Uncomment it for Chrome optimization
				edgePen.moveTo(node.x, node.y);
				edgePen.lineTo(other.x, other.y);
				edgePen.stroke(); // comment this line out for Firefox optimization. Uncomment it for Chrome optimization
		
			/*	if(this.numDrawnEdges % 40 == 0) //uncomment this block for Firefox optimization. Comment it out for Chrome optimization
				{
					edgePen.stroke();
					edgePen.beginPath();
				}
				this.numDrawnEdges++;*/ //uncomment this block for Firefox optimization. Comment it out for Chrome optimization
				
				// set drawn edge flags to true so they don't get drawn twice.
				
				this.drawnEdges[i + "," + node.id] = true;
				this.drawnEdges[node.id + "," + i] = true;
				
			}
		}
		
	}

/* *
 * graphDrawPV
 * Draws the graph in Protovis
 * Preconditions: 
 * Postconditions: The graph is drawn in its SVG Document.
 * */

function graphDrawPV()
{
	var pvNodes = this.pvJSONnodes = [];
	var pvLinks = this.pvJSONedges = [];
	
	var i;
	for(i in this.nodes)
	{
		var myNode = this.nodes[i];
		// we'll hack some new attributes onto the node objects so that Protovis can use them in its network layout
		myNode.nodeName = myNode.label;
		myNode.group = 0;
		myNode.highlighted = 0;
		myNode.label = null;

		var j;
		for(j in myNode.edges)
		{
			var other = myNode.edges[j];
			
			
			if(!this.drawnEdges[j + "," + i])
			{
				pvLinks[this.numDrawnEdges] = {source:i, target:j, value:1};
				this.drawnEdges[j + "," + i] = true;
				this.drawnEdges[i + "," + j] = true;
				this.numDrawnEdges++;
			}
		}
	}
}


/* *
 * graphToolTipSVG
 * Draws the tooltip for a node in SVG.
 * Preconditions: Called when a node generates an onmouseover event. The graph assumes that 
 * 		its SVG document has a function with the signature drawToolTip(nodeid) which simply makes a call 
 * 		to this function, passing in its nodeid parameter. The graph also assumes its SVG document 
 * 		has a group element with the id "toolTips" placed after its "nodeGroup" group. 
 * Inputs: nodeid is the id of the node that generated the onmouseover event.
 * Postconditions: A tooltip appears just under the node, displaying the node's id.
 * */

function graphToolTipSVG(nodeid) 
{
	var myNode = this.nodes[nodeid];
	
	// We're going to bundle all the elements defining the tooltip's image into a group with a unique id.
	// This will make erasing the tooltip easier when the user's mouse leaves this node.
	
	var ttGroup = this.painter.createElementNS("http://www.w3.org/2000/svg", "g");
	this.painter.getElementById("toolTips").appendChild(ttGroup);
	
	ttGroup.setAttributeNS(null, "id", "tt"+nodeid);
	
	var ttX = myNode.x - 10;
	var ttY = myNode.y + 24;
	
	// draw the highlighted box for the tooltip
	
	var ttRect = this.painter.createElementNS("http://www.w3.org/2000/svg", "rect");
	ttGroup.appendChild(ttRect);
	
	ttRect.setAttribute("x",ttX);
	ttRect.setAttribute("y",ttY);
	ttRect.setAttribute("height",20);
	ttRect.setAttributeNS(null, "style", "fill:#FFFFAA;stroke:#AA5555;stroke-width:3");
	
	
	// write the node's id inside the box
	
	var ttText = svgDocument.createElementNS("http://www.w3.org/2000/svg", "text");
	var myText = svgDocument.createTextNode(myNode.label);
	ttText.appendChild(myText);
	ttGroup.appendChild(ttText);
	
	ttText.setAttribute("x",ttX+5);
	ttText.setAttribute("y",ttY+17);
	ttText.setAttributeNS(null, "style", "font-family:arial;font-size:8pt");

	// adjust width of tooltip box based on the text's width
	
	ttRect.setAttribute("width",ttText.getBBox().width + 10);
	
}

/* *
 * graphToolTipCanvas
 * Draws the tooltip for a node in Canvas.
 * Inputs: x,y are the Canvas coordinates of the mouse
 * Postcondition: If the mouse is hovering over a node, a tooltip appears just under the node, displaying its id.
 * */

function graphToolTipCanvas(x,y)
{
	var nodePen = this.nodePen;
	var edgePen = this.edgePen;
	nodePen.lineWidth = 3;
	edgePen.lineWidth = 3;
	
	// use the ID map to figure out which node the mouse is pointing to.
	
	var nodeid = this.getMouseNode(x,y);
	
	// if the mouse is pointing to a node, draw its tooltip.
	
	if(nodeid)
	{
		var myNode = this.nodes[nodeid];
		var ttx = myNode.x - 10;
		var tty = myNode.y + 24;
		
		nodePen.font = "8pt arial";
		var ttw = nodePen.measureText(myNode.label).width + 10;
		
		mpRect(nodePen, ttx,tty,ttw,20,"#AA5555","#FFFFAA");
		nodePen.lineWidth = 1;
		mpText(nodePen, myNode.label, ttx+5,tty+5, "black","black");
		
		this.needsRedraw = true;
	}
	
	return nodeid;
}

/* *
 * eraseToolTipSVG
 * Erases the tooltip for a node in SVG.
 * Preconditions: Called when a node generates an onmouseout event. The graph object assumes that 
 * 		the SVG document has a function with the signature eraseToolTip(nodeid) which simply makes a call 
 * 		to this function, passing in its nodeid parameter.
 * Inputs: nodeid is the id of the node that generated the onmouseout event.
 * Postconditions: The node's tooltip disappears.
 * */

function graphEraseToolTipSVG(nodeid) 
{
	var ttGroup = this.painter.getElementById("tt" + nodeid);
	if(ttGroup)
		ttGroup.parentNode.removeChild(ttGroup);
}


/* *
 * graphHighlightFXSVG
 * Implements an interactive highlighting effect in SVG.
 * Preconditions: Called when a node generates an onclick event. The graph object assumes that 
 * 		the SVG document has a function with the signature highlightFX(nodeid) which simply makes a call 
 * 		to this function, passing in its nodeid parameter.
 * Inputs: nodeid is the id of the node that generated the onclick event.
 * Postconditions: The clicked node and its neighbors' highlight switch is toggled. Highlighted nodes are 
 * 		brightened.
 * */

function graphHighlightFXSVG(nodeid) 
{
	var svgDoc = this.painter;
	
	// start a list of nodes that need to be toggled, starting with this node's DOM element and adding its neighbors' DOM elements
	// accessing all the DOM elements first before modifying their attributes helps to optimize speed.
	
	var myNode = this.nodes[nodeid];
	var toggleObjs = [];
	toggleObjs[nodeid] = svgDoc.getElementById(nodeid);
	
	for(i in myNode.edges)
	{
		toggleObjs[i] = svgDoc.getElementById(i);
	}
	
	// Now that we have all the DOM elements that needs changing, toggle their highlight.
	
	var id;
	for(id in toggleObjs)
	{
		this.highlighted[id] = 1- this.highlighted[id];
		
		if(this.highlighted[id])
		{
			toggleObjs[id].setAttributeNS(null, "style", "fill:#CCCC00;stroke:#AA5500;stroke-width:3");
			//alert(nodeid + " has been highlighted");
		}
		else
		{
			toggleObjs[id].setAttributeNS(null, "style", "fill:#00AAFF;stroke:#000000;stroke-width:3");
			//alert(nodeid + " has been unhighlighted");
		}
	}
	
	// avoid memory leak
		svgDoc = null;
		nodeid = null;
}

/* *
 * graphHighlightFXCanvas
 * Implements an interactive highlighting effect in Canvas.
 * Inputs: x,y are the Canvas coordinates of the mouse.
 * Postconditions: The clicked node and its neighbors' highlight switch is toggled. Highlighted nodes are 
 * 		brightened.
 * */

function graphHighlightFXCanvas(x,y) 
{
	var nodePen = this.nodePen;
	var edgePen = this.edgePen;
	nodePen.lineWidth = 3;
	edgePen.lineWidth = 3;
	
	// Use the ID map to figure out which node the user just clicked.
	
	var nodeid = this.getMouseNode(x,y);
	
	// if the user clicked a node, run the neighbor highlighting feature on that node and its neighbors.
	
	if(nodeid)
	{
		var myNode = this.nodes[nodeid];
		
		// toggle this node
	
		this.highlighted[nodeid] = 1- this.highlighted[nodeid];
		
		// now toggle all of its neighbors.
		
		for(i in myNode.edges)
		{
			this.highlighted[i] = 1- this.highlighted[i];
		}
		this.needsRedraw = true;
	}
	
	return nodeid;
	
}


/* *
 * graphHighlightFXPV
 * Implements an interactive highlighting effect in Canvas.
 * Inputs: nodeid is the id of the node that generated the onclick event.
 * Postconditions: The clicked node and its neighbors' highlight switch is toggled. Highlighted nodes are 
 * 		brightened.
 * */

function graphHighlightFXPV(nodeid) 
{
		
		var myNode = this.nodes[nodeid];
		
		// toggle this node
	
		myNode.highlighted = 1 - myNode.highlighted;
		
		// now toggle all of its neighbors.
		
		for(i in myNode.edges)
		{
			var other = myNode.edges[i];
			other.highlighted = 1 - other.highlighted;
		}
		this.needsRedraw = true;

	
}


/* *
 * graphGetMouseNode
 * Finds the id of the node the mouse is currently hovering over.
 * Inputs: x,y are the Canvas coordinates of the mouse.
 * Postconditions: If the mouse is over a node in the ID map, that node's ID is returned. Otherwise it returns null.
 * */

function graphGetMouseNode(x,y)
{
	
	if(this.idMap[Math.floor(x/this.idMapRes)] == null)
	{
		return null;
	}
	var nodeid = this.idMap[Math.floor(x/this.idMapRes)][Math.floor(y/this.idMapRes)];
	
	return nodeid;
}


/* *
 * graphUnhighlightAll
 * Unhighlights all the nodes in the graph.
 * Postconditions: All highlighted nodes are unhighlighted.
 * */

function graphUnhighlightAll()
{
	var i;
	if(this.typeStr == "SVG")
	{
		var svgDoc = this.painter;
		var resetDOMs = [];
		// first, navigate the DOM for the SVG elements.
		
		for(i in this.nodes)
		{
			if(this.highlighted[i])
			{
				resetDOMs[i] = svgDoc.getElementById(i);
				this.highlighted[i] = 0;
			}
		}
		
		// then loop through the array of pointers to change the DOM element attributes. This helps to optimize speed.
		for(i in resetDOMs)
		{
			resetDOMs[i].setAttributeNS(null, "style", "fill:#00AAFF;stroke:#000000;stroke-width:3");
		}
	}
	else if(this.typeStr == "Protovis")
	{
		var pvNodes = this.nodes;
		
		var i;
		for(i in pvNodes)
		{
			pvNodes[i].highlighted = 0;
		}
		vis.render();
	}
	else
	{
		for(i in this.nodes)
		{
			this.highlighted[i] = 0;
		}
	}
}



/* *
 * Keyboard object
 * Written by Stephen Lindberg
 * Created: 6/30/2011
 * Last modified: 7/1/2011 by Stephen Lindberg
 * 
 * A module for handling keyboard input. To use this object, just create a new instance of it 
 * and have your script's onkeydown and onkeyup event handlers pass on their event object to 
 * the keyboard object's setKeyDown and setKeyUp methods, respectively. 
 * */

/* *
 * constructor
 * */

function Keyboard()
{
	this.keyPressed = new Array();
	this.keyTyped = new Array();
	this.lastPressed = 0;
	
	// keycode constants
	
	this.A = 65;
	this.C = 67;
	this.R = 82;
	this.S = 83;
	this.W = 87;
	this.Q = 81;
	this.MINUS = 109;
	this.EQUALS = 61;
	
	// event handlers
	
	this.setKeyDown = keyboardSetKeyDown;
	this.setKeyUp = keyboardSetKeyUp;
	
	// methods
	
	this.pressed = keyboardPressed;
	this.typed = keyboardTyped;

}

/* *
 * keyboardSetKeyDown
 * Event handler method for onkeydown.
 * Inputs: evt is the event object passed in by your script's onkeydown event handler.
 * Postconditions: The Keyboard object marks this key as being held down.
 * */

function keyboardSetKeyDown(evt)
{
	var thiskey;
	if(evt.which)
		thiskey = evt.which;
	else
		thiskey = evt.keyCode;
	
	this.keyPressed[thiskey] = true;

	this.lastPressed = thiskey;
}

/* *
 * keyboardSetKeyUp
 * Event handler method for onkeyup.
 * Inputs: evt is the event object passed in by your script's onkeyup event handler.
 * Postconditions: The Keyboard object marks this key as being released.
 * */

function keyboardSetKeyUp(evt)
{
	var thiskey;
	if(evt.which)
		thiskey = evt.which;
	else
		thiskey = evt.keyCode;
	
	this.keyPressed[thiskey] = false;
	this.keyTyped[thiskey] = false;
}

/* *
 * keyboardPressed
 * Tests to see if a key is being held down.
 * Inputs: The key code for the key we're checking.
 * Postconditions: Returns true if the key is being held down. Returns false otherwise.
 * */
 
function keyboardPressed(keycode)
{
	if(this.keyPressed[keycode])
		return true;
	else
		return false;
}

/* *
 * keyboardTyped
 * Tests to see if a key is typed.
 * Inputs: The key code for the key we're checking.
 * Postconditions: Returns true if the key is registered as pressed for the first time 
 * 		since it was last released. Returns false otherwise.
 * */

function keyboardTyped(keycode)
{
	if(this.keyPressed[keycode] && !this.keyTyped[keycode])
	{
		this.keyTyped[keycode] = true;
		return true;
	}
	else
		return false;
}


/* *
 * Node object
 * written by: Stephen Lindberg
 * Created: 6/21/11
 * Last modified: 7/28/11
 * 
 * */

/* *
 * constructor
 * Inputs: x is the x coordinate where the node will be rendered. y is its y coordinate.
 * 		id is a string representing a unique id for this node.
 * */

function Node(x,y,id,label)
{
	this.x = x;
	this.y = y;
	this.id = id;
	this.numEdges = 0;
	this.edges = new Array();
	this.drawnEdges = new Array();
	this.edgeSprites = new Array(); // only used by SVG
	
	if(label)
		this.label = label;
	else
		this.label = id;
	
	this.addEdge = nodeAddEdge;
	this.hasEdge = nodeHasEdge;
	this.destroy = nodeDestroy;
//	this.drawSVG = nodeDrawSVG;
//	this.drawEdgesSVG = nodeDrawEdgesSVG;
}

/* *
 * nodeDestroy
 * Destructor
 * */

function nodeDestroy()
{
	this.edges = null;
	this.drawnEdges = null;
	this.edgeSprites = null;
}

/* *
 * nodeAddEdge
 * Creates an edge between this node and another node.
 * Inputs: node is another node object.
 * Postconditions: a bidirectional edge is established between this and node.
 * */

function nodeAddEdge(node)
{
	if(this.edges[node.id] == null)
	{
		this.edges[node.id] = node;
		node.addEdge(this);
		this.numEdges++;
	}
}

/* *
 * nodeHasEdge
 * Inputs: node is another node object.
 * Postconditions: Returns true if this has an edge to node. False otherwise.
 * */

function nodeHasEdge(node)
{
	if(this.edges[node.id])
		return true;
	return false;
}





/* *
 * StopWatch object
 * Written by: Stephen Lindberg
 * Created: 7/1/2011
 * Last modified: 7/19/2011 by Stephen Lindberg
 * */

/* *
 * Constructor
 * */

function StopWatch()
{
	this.curDate = new Date();
	this.lastDate = this.curDate.getTime();
	this.stoppedTime = this.lastDate;
	
	this.elapsedTime = 0;
	this.isRunning = false;
	
	this.start = stopwatchStart;
	this.getTime = stopwatchGetTime;
	this.pause = stopwatchPause;
	this.unpause = stopwatchUnpause;
}

/* *
 * stopwatchStart
 * Resets the stopwatch and begins timing.
 * Postconditions: resets the stopwatch to the current time and begins timing.
 * */

function stopwatchStart()
{
	this.curDate = new Date();
	this.lastDate = this.curDate.getTime();
	this.elapsedTime = 0;
	this.isRunning = true;
}

/* *
 * stopwatchGetTime
 * Returns the amount of time that has elapsed since stopwatchStart was last called.
 * Postconditions: Returns the amount of time that has elapsed since stopwatchStart was last called.
 * */

function stopwatchGetTime()
{
	if(this.isRunning)
	{
		this.curDate = new Date();
		this.elapsedTime = this.curDate.getTime() - this.lastDate;
	}
	else
	{
		this.elapsedTime = this.stoppedTime - this.lastDate;
	}	
	
	return this.elapsedTime;
}

/* *
 * stopwatchPause
 * Stops the stop watch
 * Postconditions: the stop watch is paused, but not reset.
 * */

function stopwatchPause()
{
	this.curDate = new Date();
	this.isRunning = false;
	this.stoppedTime = this.curDate.getTime();
}

/* *
 * stopwatchContinue
 * The stop watch continues timing after being paused.
 * Postconditions: The stop watch is unpaused.
 * */

function stopwatchUnpause()
{
	this.curDate = new Date();
	this.isRunning = true;
	this.lastDate += this.curDate.getTime() - this.stoppedTime;
}

/* *
 * dataPage.js
 * Written by: Stephen Lindberg
 * Created: 7/11/11
 * Last modified: 7/19/11 by Stephen Lindberg
 * 
 * This js file only contains a function for displaying time data collected by the prototypes in a printable web browser window. 
 * Its purpose is to make data collection easier, especially for recording data from several hundred graph renderings. That would 
 * be a lot of information to write down by hand! 
 * */

/* *
 * displayDataWindow
 * Creates a pop-up window that displays data received from the calling prototype. The window will
 * 		immediately request itself to be printed.
 * Preconditions: This function assumes that your pop-up blocker is turned off.
 * Inputs: nodes is the number of nodes in our graph.
 * 		connectivity is the graph's connectivity
 * 		data is the time data collected by the calling prototype. data[0] contains the sum of all the collected time. 
 * 			data[1] contains the number of time data recorded. data[2 - n+2] contains the individual time data.
 * 		dataType is a String to show what type of data the prototype recorded ("Initial Rendering" or "Interactive Redrawing").
 * 		tool is a String to show which tool was used by the prototype ("Canvas" or "SVG").
 * Postconditions: The data received by the prototype is nicely formatted and displayed in the window. The window will request itself 
 * 		to be printed by pulling up the browser's print wizard.
 * */

function displayDataWindow(nodes, connectivity, data, dataType, tool)
{
	var dataCollectWindow=window.open('','','width=640,height=480');
	var pageStr = "<html><head></head>";
	pageStr += "<body style='font-size:10pt'>";
	pageStr += "<b>Web-based Large Graph Visualization project</b><br/>";
	pageStr += "Data collection form <br/><br/>";
	pageStr += "Measuring: " + dataType + "<br/><br/>";
	pageStr += "Tool: " + tool + "<br/><br/>";
	pageStr += "# Nodes: " + nodes + "<br/>";
	pageStr += "Connectivity: " + connectivity + "<br/><br/>";
	if(dataType == "Initial Rendering")
	{
		pageStr += "Server Time (ms) <br/><br/>";
		pageStr += "<table style='border-collapse:collapse; padding:5px; border:1px solid black;'>";
		
		var i;
		for(i = 0; i < data[1]; i++)
		{
			if(i % 10 == 0)
			{
				pageStr += "<tr>";
			}
			pageStr += "<td style='width:70px; font-size:10pt; border:1px solid black;'> " + data[i+103] + " </td>";
			if(i % 10 == 9)
			{
				pageStr += "</tr>";
			}
		}
		pageStr += "</table><br/>";
		pageStr += "Average time (ms): " + (data[102] / data[1]) + "<br /><br />";
	}
	pageStr += "Draw Times (ms) <br/><br/>";
	pageStr += "<table style='border-collapse:collapse; padding:5px; border:1px solid black;'>";
	
	var i;
	for(i = 0; i < data[1]; i++)
	{
		if(i % 10 == 0)
		{
			pageStr += "<tr>";
		}
		pageStr += "<td style='width:70px; font-size:10pt; border:1px solid black;'> " + data[i+2] + " </td>";
		if(i % 10 == 9)
		{
			pageStr += "</tr>";
		}
	}
	
	pageStr += "</table><br/>";
	pageStr += "Average time (ms): " + (data[0] / data[1]) + "<br /><br />";
	if(dataType == "Initial Rendering")
		pageStr += "<b>Total Average time (ms):</b> " + ((data[0] / data[1]) + (data[102] / data[1])) + "<br /><br />";
	pageStr += "<form><input type='button' value='Print' onclick='window.print();' /></form>"
	pageStr += "</body></html>";
	dataCollectWindow.document.write(pageStr);
	dataCollectWindow.blur();
	
//	dataCollectWindow.document.onfocus = new function(evt){dataCollectWindow.print();};
}


/* *
 * interactiveMacro object
 * written by: Stephen Lindberg
 * Created: 7/25/11
 * Last modified: 7/25/11 by Stephen Lindberg
 * 
 * A macro that emulates a series of predefined mouse and keyboard events used for interactive data collection.
 * */

/* *
 * Constructor
 * Inputs: painterX and painterY are the coordinate offsets for the mouse. Canvas will need the upper-left corner 
 * 		coordinates of the canvas object, but SVG just needs (0,0). 
 * 		kb is the keyboard object used by the prototype.
 * 		graph is the graph object created by the prototype.
 * 		myCamera is the prototype's camera.
 * */

function interactiveMacro(painterX,painterY,kb, graph, myCamera)
{
	this.iter = 0;
	this.evt = new fakeEvent();
	this.painterX = painterX;
	this.painterY = painterY;
	this.kb = kb;
	this.graph = graph;
	this.camera = myCamera;
	
	// methods
	
	this.go = macroGo;
	this.setMouse = macroMouse;
	this.moveMouse = macroMoveMouse;
	this.resetKB = macroResetKB;
	this.keyPress = macroKeyPress;
}

	/* *
	 * fakeEvent helper object
	 * An object used for passing data for emulated mouse and keyboard events.
	 * */
	 
	function fakeEvent()
	{
		this.which = 0;
		this.clientX = 0;
		this.clientY = 0;
	}

/* *
 * macroGo
 * Runs the next emulation in the macro. If the macro hasn't started yet, then it starts from the beginning.
 * */

function macroGo()
{
	this.resetKB();
	console.log(this.iter);
	if(this.iter == 0)
	{
		this.keyPress(this.kb.R);
		this.setMouse(-20,-20);
		myOnmousedown(this.evt);
	}
	if(this.iter == 0)//(this.iter >=0 && this.iter < 3)
	{	
		this.moveMouse(-100,-100);
		this.keyPress(this.kb.EQUALS);
	}
	if(this.iter == 1)//(this.iter >=3 && this.iter < 5)
	{	
		this.moveMouse(100,100);
		this.keyPress(this.kb.MINUS);
	}
	if(this.iter == 2)
	{
		myOnmouseup(this.evt);
		this.keyPress(this.kb.R);
		var node = this.graph.nodes[0];
		var nodeT = this.camera.worldToCanvas(node.x,node.y);
		this.setMouse(nodeT[0],nodeT[1]);
		myOnmousedown(this.evt);
		this.setMouse(320,200);
		clickedNode = node.id;
		
	}
	if(this.iter >=3 && this.iter < 5)//(this.iter >=5 && this.iter < 8)
	{
		this.keyPress(this.kb.EQUALS);
		this.moveMouse(100,50);
	}
	if(this.iter == 5)
	{
		this.keyPress(this.kb.EQUALS);
		this.moveMouse(-100,40);
	}
	
	// next iteration
	
	this.iter++;
	
	// this macro only uses 5 frames of input. After the 20th frame, reset the macro and reset the input controls.
	
	if(this.iter == 6)
	{
		this.iter = 0;
		myOnmouseup(this.evt);
		this.resetKB();
	}
}

/* *
 * macroMouse
 * sets the emulated mouse's position.
 * Inputs: x,y are the Canvas coordinates to set the emulated mouse to.
 * Postconditions: The emulated mouse is moved to (x,y) in canvas coordinates.
 * */

function macroMouse(x,y)
{
	this.evt.clientX = x + this.painterX;
	this.evt.clientY = y + this.painterY;
	myOnmousemove(this.evt);
}

/* *
 * macroMoveMouse
 * moves the emulated mouse relative to its current position.
 * Inputs: dx,dy are the units to move the mouse's current x and y coordinates, respectively.
 * Postconditions: The emulated mouse is moved (dx,dy) units.
 * */
 
function macroMoveMouse(dx,dy)
{
	this.evt.clientX += dx;
	this.evt.clientY += dy;
	myOnmousemove(this.evt);
}

/* *
 * macroResetKB
 * resets the emulated keyboard.
 * Postconditions: resets the emulated keyboard.
 * */

function macroResetKB()
{
	this.kb.keyPressed = [];
	this.kb.keyTyped = [];
}

/* *
 * macroKeyPress
 * mimics a key press on the emulated keyboard.
 * Inputs: keycode is the keycode of the keystroke to emulate
 * Postconditions: the emulated key matching keycode is pressed.
 * */
 
function macroKeyPress(keycode)
{
	this.evt.which = keycode;
	this.kb.setKeyDown(this.evt);
}

/* *
 * magicPen.js
 * written by Stephen Lindberg
 * created 6/23/11
 * last modified 6/28/11 by Stephen Lindberg
 * 
 * A library of functions to help with drawing stuff
 * in HTML 5's canvas. 
 * */

var mpTransR = 0;
var mpTransG = 0;
var mpTransB = 0;
var mpTransTol = 0;

/* *
 * mpClear
 * Clears a canvas with a color.
 * Inputs: pen is the context object for our canvas. 
 * 		color is the color that will be used to clear the canvas.
 * Postconditions: pen's canvas is filled with color. If color is
 * 		not specified, then the entire canvas is cleared with the transparent color.
 * */

function mpClear(pen, color)
{
	var w = pen.canvas.width;
	var h = pen.canvas.height;
	if(color)
	{
		if(color instanceof mpLinearGradient || color instanceof mpRadialGradient)
		{
			pen.fillStyle = color.makeGrad(pen,0,0,w,h);
		}
		else if(color instanceof mpPattern)
		{
			pen.fillStyle = color.makePat(pen,0,0);
		}
		else if(color instanceof Camera)
		{
			pen.clearRect(color.left, color.top, w/color.zoom, h/color.zoom);
			return;
		}
		else
		{
			pen.fillStyle = color;
		}
		pen.fillRect (0, 0, w, h);
	}
	else
	{
		pen.clearRect(0,0,w,h);
	}
}

/* *
 * mpCircle
 * Draws a circle.
 * Inputs: pen is the context object for our canvas.
 * 		x and y are the coordinates for the circle's center. r is the circle's radius.
 * 		stroke is the color of the circle's outline. fill is the color of the circle's interior.
 * Postconditions: The circle is drawn to pen's canvas. If stroke is not given, then 
 * 		the circle's outline color will use pen's current strokeStyle. If fill is not given, 
 * 		then the circle's interior is transparent.
 * */

function mpCircle(pen,x,y,r,stroke,fill)
{
	
	
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x-r,y-r,r*2,r*2);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x-r,y-r);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	if(fill)
	{
		if(fill instanceof mpLinearGradient || fill instanceof mpRadialGradient)
		{
			pen.fillStyle = fill.makeGrad(pen,x-r,y-r,r*2,r*2);
		}
		else if(fill instanceof mpPattern)
		{
			pen.fillStyle = fill.makePat(pen,x-r,y-r);
		}
		else
		{
			pen.fillStyle = fill;
		}
		
	}
	__mpCircleHelper(pen,x,y,r,stroke,fill);
	
}

function __mpCircleHelper(pen,x,y,r,stroke,fill)
{
	pen.beginPath();
	pen.arc(x, y, r, 0, Math.PI*2, true);
	if(fill)
		pen.fill();
	pen.stroke();
}

/* *
 * mpEllipse
 * Draws an ellipse.
 * Inputs: pen is the context object for our canvas.
 * 		x and y are the coordinates for the circle's center. 
 * 		rh is the ellipse's horizontal radius.
 * 		rv is the ellipse's vertical radius.
 * 		stroke is the color of the circle's outline. 
 * 		fill is the color of the circle's interior.
 * Postconditions: The circle is drawn to pen's canvas. If stroke is not given, then 
 * 		the circle's outline color will use pen's current strokeStyle. If fill is not given, 
 * 		then the circle's interior is transparent.
 * */

function mpEllipse(pen,x,y,rh,rv,stroke,fill)
{
	pen.beginPath();
	
	// drawing an ellipse requires some Tomfoolery involving transformations. We must translate the origin
	// to the center of the ellipse before scaling it. Otherwise it won't be positioned correctly.
	pen.save();
	pen.translate(x,y);
	pen.scale(1.0, rv/rh);
	pen.arc(0, 0, rh, 0, Math.PI*2, true);
	pen.restore();
	
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x-rh,y-rv,rh*2,rv*2);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x-rh,y-rv);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	if(fill)
	{
		if(fill instanceof mpLinearGradient || fill instanceof mpRadialGradient)
		{
			pen.fillStyle = fill.makeGrad(pen,x-rh,y-rv,rh*2,rv*2);
		}
		else if(fill instanceof mpPattern)
		{
			pen.fillStyle = fill.makePat(pen,x-rh,y-rv);
		}
		else
		{
			pen.fillStyle = fill;
		}
		pen.fill();
	}
	pen.stroke();
	
}


/* *
 * mpRect
 * Draws a rectangle.
 * Inputs: pen is the context object for our canvas.
 * 		x and y are the coordinates for the rectangle's upper-left corner. 
 * 		w and h are the rectangle's width and height, respectively.
 * 		stroke is the color of the rectangle's outline. fill is the color of the rectangle's interior.
 * Postconditions: The rectangle is drawn to pen's canvas. If stroke is not given, then 
 * 		the rectangle's outline color will use pen's current strokeStyle. If fill is not given, 
 * 		then the rectangle's interior is transparent.
 * */

function mpRect(pen,x,y,w,h,stroke,fill)
{
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x,y,w,h);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x,y);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	if(fill)
	{
		if(fill instanceof mpLinearGradient || fill instanceof mpRadialGradient)
		{
			pen.fillStyle = fill.makeGrad(pen,x,y,w,h);
		}
		else if(fill instanceof mpPattern)
		{
			pen.fillStyle = fill.makePat(pen,x,y);
		}
		else
		{
			pen.fillStyle = fill;
		}
		pen.fillRect(x,y,w,h);
	}
	pen.strokeRect(x,y,w,h);
	
}


/* *
 * mpRoundedRect
 * Draws a rectangle with rounded corners.
 * Inputs: pen is the context object for our canvas.
 * 		x and y are the coordinates for the rectangle's upper-left corner. 
 * 		w and h are the rectangle's width and height, respectively. r is the radius of the 
 * 		rectangle's corners. stroke is the color of the rectangle's outline. 
 * 		fill is the color of the rectangle's interior.
 * Postconditions: The rectangle is drawn to pen's canvas. If stroke is not given, then 
 * 		the rectangle's outline color will use pen's current strokeStyle. If fill is not given, 
 * 		then the rectangle's interior is transparent.
 * */

function mpRoundedRect(pen,x,y,w,h,r,stroke,fill)
{
	var mpangle = function(degrees)
	{
		return (degrees)/180*Math.PI;
	};
	pen.beginPath();
	pen.moveTo(x+r,y);
	pen.lineTo(x+w-r,y);
	pen.arc(x+w-r,y+r,r,mpangle(270),mpangle(0),false);
	pen.lineTo(x+w,y+h-r);
	pen.arc(x+w-r,y+h-r,r,mpangle(0),mpangle(90),false);
	pen.lineTo(x+r,y+h);
	pen.arc(x+r,y+h-r,r,mpangle(90),mpangle(180),false);
	pen.lineTo(x,y+r);
	pen.arc(x+r,y+r,r,mpangle(180),mpangle(270),false);
	
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x,y,w,h);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x,y);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	if(fill)
	{
		if(fill instanceof mpLinearGradient || fill instanceof mpRadialGradient)
		{
			pen.fillStyle = fill.makeGrad(pen,x,y,w,h);
		}
		else if(fill instanceof mpPattern)
		{
			pen.fillStyle = fill.makePat(pen,x,y);
		}
		else
		{
			pen.fillStyle = fill;
		}
		pen.fill();
	}
	pen.stroke();
	
}


/* *
 * mpLine
 * Draws a line.
 * Inputs: pen is the context object for our canvas.
 * 		x1 and y1 are the coordinates for the line's start point. 
 * 		x2 and y2 are the coordinates for the line's end point.
 * 		stroke is the color of the rectangle's outline. 
 * Postconditions: The line is drawn to pen's canvas. If stroke is not given, then 
 * 		the line's color will use pen's current strokeStyle. 
 * */

function mpLine(pen,x1,y1,x2,y2,stroke)
{
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x1,y1,x2-x1,y2-y1);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x,y);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	__mpLineHelper(pen,x1,y1,x2,y2,stroke);
}

function __mpLineHelper(pen,x1,y1,x2,y2,stroke)
{
	pen.beginPath();
	pen.moveTo(x1,y1);
	pen.lineTo(x2,y2);
	pen.stroke();
}


/* *
 * mpText
 * Draws text.
 * Inputs: pen is the context object for our canvas.
 * 		x and y are the (approximated) coordinates of the text's upper-left corner.
 * 		stroke is the color of the text's outline. 
 * 		fill is the inner color of the text. 
 * 		maxWid is optional and places a maximum pixel width restraint on the text.
 * Postconditions: The line is drawn to pen's canvas. If stroke is not given, then 
 * 		the line's color will use pen's current strokeStyle. 
 * */

function mpText(pen,txt,x,y,stroke,fill,maxWid)
{
	// obtain the dimensions of the text in case we're going to use scaled gradients.
	var textDims = pen.measureText(txt);
	if(maxWid)
		textDims.width = maxWid;
	else
		maxWid = textDims.width;
	
	
	// A trick for approximating the height of the text (since measureText only returns the width).
	// This may not work for all fonts.
	textDims.height = pen.measureText("m").width;
	
	if(stroke)
	{
		if(stroke instanceof mpLinearGradient || stroke instanceof mpRadialGradient)
		{
			pen.strokeStyle = stroke.makeGrad(pen,x,y,textDims.width, textDims.height);
		}
		else if(stroke instanceof mpPattern)
		{
			pen.strokeStyle = stroke.makePat(pen,x,y);
		}
		else
		{
			pen.strokeStyle = stroke;
		}
	}
	if(fill)
	{
		if(fill instanceof mpLinearGradient || fill instanceof mpRadialGradient)
		{
			pen.fillStyle = fill.makeGrad(pen,x,y,textDims.width, textDims.height);
		}
		else if(fill instanceof mpPattern)
		{
			pen.fillStyle = fill.makePat(pen,x,y);
		}
		else
		{
			pen.fillStyle = fill;
		}
	}
	else
	{
		pen.fillStyle = pen.strokeStyle;
	}

	pen.fillText(txt,x,y+textDims.height,maxWid);
	pen.strokeText(txt,x,y+textDims.height,maxWid);
	
}





/* *
 * mpImage
 * Draws an image from either an image element or another canvas.
 * Inputs: pen is the context object for our canvas.
 * 		img is our source image.
 * 		x and y are the coordinates where the image's upper-left corner will be placed.
 * 		w and h are optional. They define the scaled width and height of the image, respectively.
 * 		If w and h are left out, the image's dimensions will be the same as the original.
 * Postconditions: The image is drawn to pen's canvas.
 * */
 
function mpImage(pen,img,x,y,w,h)
{
	if(h)
	{	
		if(mpTransTol > 0)
		{
			var tempCanvas = __mpApplyTransparentColor(pen,img,w,h,0,0,img.width,img.height);
			
			// draw the temporary pen's canvas to our canvas.
			pen.drawImage(tempCanvas, x, y);
		}
		else
		{
			pen.drawImage(img,x,y,w,h);
		}
	}
	else
	{	
		if(mpTransTol > 0)
		{
			var tempCanvas = __mpApplyTransparentColor(pen,img,w,h,0,0,img.width,img.height);
			
			// draw the temporary pen's canvas to our canvas.
			pen.drawImage(tempCanvas, x, y);
		}
		else
		{
			pen.drawImage(img,x,y);
		}
	}
}

/* *
 * mpImageBlitter
 * Draws an image from a portion of either an image element or another canvas.
 * Inputs: pen is the context object for our canvas. img is our source image.
 * 		x and y are the coordinates where the image portion's upper-left corner will be placed.
 * 		w and h are the scaled width and height of the image portion, respectively.
 * 		sx,sy,sw,and sh define the rectangle bounding the portion of the image we want to draw.
 * Postconditions: The image portion is drawn to pen's canvas.
 * */
 
function mpImageBlitter(pen,img,x,y,w,h,sx,sy,sw,sh)
{

	if(mpTransTol > 0)
	{
		var tempCanvas = __mpApplyTransparentColor(pen,img,w,h,sx,sy,sw,sh);
		
		// draw the temporary pen's canvas to our canvas.
		pen.drawImage(tempCanvas, x, y);
	}
	else
	{
		pen.drawImage(img, sx, sy, sw, sh, x, y, w, h);
	}


}


/* *
 * mpSetTransColor
 * sets magicPen's global transparent color.
 * Inputs: r, g, b define the color that will be made transparent by shapes using
 * 		the transparent color.
 * 		tol is the tolerance level for the transparent color. This should be an int value with 0
 * 			turning off the transparent color, 1 forces the transparent color to match exactly, and any value greater 
 * 			than 1 allows colors close in rgb value to the transparent color to be made transparent.
 * Postconditions: magicPen's global transparent color is set to r, g, b.
 * */

function mpSetTransColor(r,g,b,tol)
{
	mpTransR = r;
	mpTransG = g;
	mpTransB = b;
	mpTransTol = tol;
}

/* *
 * __mpApplyTransparentColor
 * Helper method that changes all pixels of an image matching our transparent color to transparent.
 * Inputs: pen is the context object for our canvas. img is our source image.
 * 		w and h are the scaled width and height of the image portion, respectively.
 * 		sx,sy,sw,and sh define the rectangle bounding the portion of the image we want to draw.
 * Postconditions: Returns a cropped copy of the image with our current transparent color applied to it.
 * */

function __mpApplyTransparentColor(pen,img,w,h,sx,sy,sw,sh)
{
	// create a temporary canvas to work with on a pixel by pixel level
		var tempCanvas = document.createElement("canvas");
		tempCanvas.width = w;
		tempCanvas.height = h;
		
		// get its context and draw our image to it WITHOUT smoothing.
		var tempPen = tempCanvas.getContext("2d");
		tempPen.mozImageSmoothingEnabled = false;
		tempPen.drawImage(img, sx, sy, sw, sh, 0,0,w,h);
		
		// get the temporary context's image data.
		var imgData = tempPen.getImageData(0,0,w,h);
		var myPixels = imgData.data;
		
		// loop through all it's pixels. Any pixels that match transparentColor get their
		// alpha values set to 0.
		var i = 0;
		for(i=0; i < myPixels.length; i+=4)
		{
			if(Math.abs(myPixels[i] - mpTransR) <= mpTransTol && Math.abs(myPixels[i+1] - mpTransG) <= mpTransTol && Math.abs(myPixels[i+2] - mpTransB) <= mpTransTol)
				myPixels[i+3] = 0;
				
			// call function for current filter here.
		}
		
		// put the modified pixels back in the temporary pen.
		tempPen.putImageData(imgData,0,0);
	
	return tempCanvas;
}

/* *
 * mpLinearGradient object constructor
 * Used to create reusable linear gradients which use positions relative to the shapes
 * 		using them.
 * x1,y1 are the relative coordinates of the starting color existing in a unit square space.
 * x2,y2 are the relative coordinates of the ending color existing in a unit square space.
 * */
 
function mpLinearGradient(x1,y1,x2,y2)
{
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
	
	this.stopPos = new Array();
	this.stopColor = new Array();
	this.numStops = 0;
	
	/* *
	 * setStop
	 * Adds a stop color to the gradient.
	 * Inputs: relPos is between 0.0 and 1.0 inclusively. It is the relative position of the color in the gradient.
	 * 		color is the color at this stop.
	 * Postconditions: the stop defined by the parameters is added to the gradient.
	 * */
	
	this.addColorStop = function(relPos, color)
	{
		var index = this.numStops;
		this.stopPos[index] = relPos;
		this.stopColor[index] = color;
		this.numStops++;
	};
	
	/* *
	 * makeGrad
	 * Creates a CanvasGradient object with absolute coordinates from this gradient object's 
	 * 		relative coordinates. This method will be used by magicPen's drawing methods that allow gradients.
	 * 		This method isn't recommended for external use.
	 * Inputs: pen is the context object for our canvas that will use the gradient. 
	 * 		x,y,w,h defines the calling shape's bounding box.
	 * Postconditions: returns the CanvasGradient object defined by this.
	 * */
	
	this.makeGrad = function(pen,x,y,w,h)
	{
		// transform gradient coordinates from unit square space to absolute canvas space.
		var tx1 = x + w*this.x1;
		var ty1 = y + h*this.y1;
		var tx2 = x + w*this.x2;
		var ty2 = y + h*this.y2;
				
		// create the CanvasGradient from the transformed coordinates.
		
		var grad = pen.createLinearGradient(tx1,ty1,tx2,ty2);
		
		// load the stops into the CanvasGradient
		
		var i;
		for(i = 0; i < this.numStops ; i++)
		{
			grad.addColorStop(this.stopPos[i],this.stopColor[i]);
		}
		return grad;
	};
}
 

/* *
 * mpRadialGradient object constructor
 * Used to create reusable radial gradients which use positions relative to the shapes
 * 		using them.
 * x1,y1 are the relative coordinates of the starting color existing in a unit square space.
 * x2,y2 are the relative coordinates of the ending color existing in a unit square space.
 * */
 
function mpRadialGradient(x1,y1,r1,x2,y2,r2)
{
	this.x1 = x1;
	this.y1 = y1;
	this.r1 = r1;
	this.x2 = x2;
	this.y2 = y2;
	this.r2 = r2;
	
	this.stopPos = new Array();
	this.stopColor = new Array();
	this.numStops = 0;
	
	/* *
	 * setStop
	 * Adds a stop color to the gradient.
	 * Inputs: relPos is between 0.0 and 1.0 inclusively. It is the relative position of the color in the gradient.
	 * 		color is the color at this stop.
	 * Postconditions: the stop defined by the parameters is added to the gradient.
	 * */
	
	this.addColorStop = function(relPos, color)
	{
		var index = this.numStops;
		this.stopPos[index] = relPos;
		this.stopColor[index] = color;
		this.numStops++;
	};
	
	/* *
	 * makeGrad
	 * Creates a CanvasGradient object with absolute coordinates from this gradient object's 
	 * 		relative coordinates. This method will be used by magicPen's drawing methods that allow gradients.
	 * 		This method isn't recommended for external use.
	 * Inputs: pen is the context object for our canvas that will use the gradient. 
	 * 		x,y,w,h defines the calling shape's bounding box.
	 * Postconditions: returns the CanvasGradient object defined by this.
	 * */
	
	this.makeGrad = function(pen,x,y,w,h)
	{
		// transform gradient coordinates from unit square space to absolute canvas space.
		var tx1 = x + w*this.x1;
		var ty1 = y + h*this.y1;
		var tr1 = Math.max(w,h)*this.r1;
		var tx2 = x + w*this.x2;
		var ty2 = y + h*this.y2;
		var tr2 = Math.max(w,h)*this.r2;
				
		// create the CanvasGradient from the transformed coordinates.
		
		var grad = pen.createRadialGradient(tx1,ty1,tr1,tx2,ty2,tr2);
		
		// load the stops into the CanvasGradient
		
		var i;
		for(i = 0; i < this.numStops ; i++)
		{
			grad.addColorStop(this.stopPos[i],this.stopColor[i]);
		}
		return grad;
	};
}


/* *
 * mpPattern object constructor
 * Used to create reusable patterns which use positions relative to the shapes
 * 		using them.
 * Inputs: img is the image used for the pattern. 
 * 		type is the string defining the pattern's repetition properties. Any type values valid for a 
 * 			Canvas pattern will work here.
 * 		xOff and yOff are the pattern's offset coordinates from the 
 * */

function mpPattern(img, type, xOff, yOff, w, h)
{
	this.img = img;
	this.type = type;
	this.xOff = xOff;
	this.yOff = yOff;
	this.w = w;
	this.h = h;
	
	
	/* *
	 * makePat
	 * Creates a CanvasPattern object with absolute coordinates from this gradient object's 
	 * 		relative coordinates. This method will be used by magicPen's drawing methods that allow patterns.
	 * 		This method isn't recommended for external use.
	 * Inputs: pen is the context object for our canvas that will use the gradient. 
	 * 		x,y defines top-left coordinates of the calling shape's bounding box.
	 * Postconditions: returns the CanvasPattern object defined by this.
	 * */
	
	this.makePat = function(pen,x,y)
	{
		// determine x,y transforms needed to realign the pattern properly.
		
		var tx = Math.floor(x%this.w - this.w);
		var ty = Math.floor(y%this.h - this.w);
		
		// create a resized version of our original image and apply our offset values to it.
		
		var resizedImage = document.createElement("canvas");
		resizedImage.width = this.w;
		resizedImage.height = this.h;
		var rePen = resizedImage.getContext("2d");
		rePen.drawImage(this.img,this.xOff,this.yOff,this.w,this.h);
		
		// create a temporary canvas to produce a clipped version of our repeating image
		
		var tempCanvas = document.createElement("canvas");
		tempCanvas.width = this.w;
		tempCanvas.height = this.h;
		var tempPen = tempCanvas.getContext("2d");

		// draw the resized, clipped image in a 2x2 grid to get repeating to appear correctly after realignment.
		
		var i;
		var j;

		for(i = 0 ; i < 2 ; i++)
		{
			for(j = 0; j < 2 ; j++)
			{
				tempPen.drawImage(resizedImage, 0, 0, this.w, this.h, tx + this.w*i, ty + this.h*j, this.w, this.h);
			}
		}
		
		
		var ptrn = tempPen.createPattern(tempCanvas, this.type);
		return ptrn;
	};
}





