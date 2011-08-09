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
	edgePen.beginPath();
	this.numDrawnEdges = 1;
	for(i in this.nodes) 
	{
		var myNode = this.nodes[i];
		this.drawEdges(myNode);
	}
	edgePen.stroke();

	
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
	//	edgePen.strokeStyle = "#000000";
	//	edgePen.beginPath();
		for(i in node.edges)
		{
			var other = node.edges[i]; 
			
			if(!this.drawnEdges[i + "," + node.id])
			{
			//	mpLine(edgePen, node.x, node.y, other.x, other.y, "#000000");
				
				edgePen.moveTo(node.x, node.y);
				edgePen.lineTo(other.x, other.y);
				
				if(this.numDrawnEdges % 40 == 0)
				{
					edgePen.stroke();
					edgePen.beginPath();
				}
				this.numDrawnEdges++;
				// set drawn edge flags to true so they don't get drawn twice.
				
				this.drawnEdges[i + "," + node.id] = true;
				this.drawnEdges[node.id + "," + i] = true;
				
			}
		}
	//	edgePen.stroke();
		
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



