/*jslint browser: true */
/*global $: false */
/*
	graphPrototypeCanvas.html
	Written by: Stephen Lindberg
	Created: 6/28/11
	Last modified: 7/28/11
*/


var graph;
var jData;
var jDataReadyFirstTime = true;

var viewWidth;
var viewHeight;

var pen = null;
var edgePen = null;
var bgPen = null;
var hidPen = null;

var myCamera;
var oldCenterX;
var oldCenterY;

var bgPtrn;

var mouseX = 0;
var mouseY = 0;
var clickedX = 0;
var clickedY = 0;
var clickedNode = null;
var mouseScrolled = 0;
var mouseHeld = 0;

var kb;

var timer;
var firstDrawTimer;

var numNodes;
var connectivity;

var times = [];
var timesIter;
var recording = false;
var myMacro;

/* *
	main
	This function is called when all the elements of the document are ready. It initializes all the objects for our
		application and then starts up the update loop.
	Postconditions: The application is started and enters the update loop.
* */

$(document).ready(function () {
	// get contexts for our canvases
	var c = document.getElementById("edgeGroup");
	edgePen = c.getContext("2d");
	c = document.getElementById("nodeGroup");
	pen = c.getContext("2d");
	c = document.getElementById("bgCanvas");
	bgpen = c.getContext("2d");
	c = document.getElementById("canvasHidden");
	hidpen = c.getContext("2d");
	
	// set up mouse event handlers
	
	document.onmousemove = myOnmousemove;
	document.onclick = myOnclick;
	document.onmousedown = myOnmousedown;
	document.onmouseup = myOnmouseup;
	/*
	pen.canvas.onmousemove = myOnmousemove;
	pen.canvas.onclick = myOnclick;
	pen.canvas.onmousedown = myOnmousedown;
	pen.canvas.onmouseup = myOnmouseup;
	*/
	
	// Mozilla
	if(window.addEventListener) document.addEventListener('DOMMouseScroll', myOnmousewheel, false);
	// IE/OPERA etc
	document.onmousewheel = myOnmousewheel;
	  
	// set up keyboard input
	kb = new Keyboard();
	window.onkeydown = function(evt)
	{
		if(!evt)
			evt = this.event;
		kb.setKeyDown(evt);
	};
	window.onkeyup = function(evt)
	{
		if(!evt)
			evt = this.event;
		kb.setKeyUp(evt);
		
	};
	
	// create background pattern
	
	var ptrnImg = document.createElement("canvas");
	var ptrnPen = ptrnImg.getContext("2d");
	ptrnImg.width = 32;
	ptrnImg.height = 32;
	
	//mpRect(ptrnPen,0,0,16,16,"lightblue","lightblue");
	//mpRect(ptrnPen,16,16,16,16,"lightblue","lightblue");
	
	bgPtrn = new mpPattern(ptrnImg, "repeat",0,0,32,32);
	
//	mpText(hidpen, "Move mouse to pan the camera.  ",200,10,"black","black");
//	mpText(hidpen, "- and + or mouse wheel to zoom the camera in and out.  " ,200,30,"black","black");
//	mpText(hidpen, "Press R to reset the camera and highlighted nodes.  " ,200,50,"black","black");
//	mpText(hidpen, "Press C to record redraw times.",200,70,"black","black");
	
	// set up the camera
	
	myCamera = new Camera([edgePen,pen]);
	
	
	// set up the StopWatches
	timer = new StopWatch();
	firstDrawTimer = new StopWatch();
	
	firstDrawTimer.expired = false;
	
	// Let's make a graph! :D
	graph = new Graph(document);
	
	// get graph input data from user.

	numNodes = prompt("How many nodes?");
	connectivity = prompt("How much connectivity? [0.0 , 1.0]");
	myMacro = new interactiveMacro(pen.canvas.offsetLeft,pen.canvas.offsetTop, kb, graph, myCamera);
	graph.readJSON(firstDrawTimer, numNodes, connectivity);

	// enter the update loop

	updateCanvas();
	
});

/* *
	updateCanvas
	The main timer loop of the application. This method handles all interactivity and redraws the graph.
	Postconditions: The application is updated and is scheduled to be updated again after 20 ms. If this was the first
		time through the loop, an alert message will be displayed to inform the user how long it took to initially render the 
		graph.
* */

function updateCanvas()
{

	if(graph.jsonReady)
	{
		if(jDataReadyFirstTime)
		{
			viewWidth = graph.jsonData.globalCoordinateInformation.width;
			viewHeight = graph.jsonData.globalCoordinateInformation.height;
			
			myCamera.viewWidth = viewWidth;
			myCamera.viewHeight = viewHeight;
			
			myCamera.zoomToFit();
			
		//	mpText(hidpen, "# Nodes: " + graph.numNodes + ", # Edges: " + graph.numEdges ,10,70,"black","black");
			
			jDataReadyFirstTime = false;
			
		}
		
		// Draw a background using our pattern
		mpClear(bgpen,"white");
		mpClear(bgpen,bgPtrn);
		
		// Press C to begin recording redraw times using input simulation macro
		
		if(myMacro.iter > 0)
		{
			myMacro.go();
		}
		if(kb.pressed(kb.C) && !recording)
		{
			times[0] = 0; // total time
			times[1] = 0; // number of recordings
			recording = true;
			
			myMacro.go();
		}
		
		// camera zoom controls
		
		if(kb.pressed(kb.W))
			myCamera.zoomTo(myCamera.zoom + myCamera.zoom*0.05);
		if(kb.pressed(kb.S))
			myCamera.zoomTo(myCamera.zoom - myCamera.zoom*0.05);
		if(kb.pressed(kb.EQUALS))
			myCamera.zoomTo(myCamera.zoom + myCamera.zoom*0.05);
		if(kb.pressed(kb.MINUS))
			myCamera.zoomTo(myCamera.zoom - myCamera.zoom*0.05);
		
		if(mouseScrolled > 0)
		{
			myCamera.zoomTo(myCamera.zoom + myCamera.zoom*0.2);
			// zoom towards mouse pointer's current world position.
			
			var camDX = (myCamera.mouseX - myCamera.centerX)*0.2;
			var camDY = (myCamera.mouseY - myCamera.centerY)*0.2;
			
			myCamera.moveTo(myCamera.centerX + camDX, myCamera.centerY + camDY);
		}
		if(mouseScrolled < 0)
		{
			myCamera.zoomTo(myCamera.zoom - myCamera.zoom*0.2);
			// zoom away from mouse pointer's current world position.
			
			var camDX = (myCamera.mouseX - myCamera.centerX)*0.2;
			var camDY = (myCamera.mouseY - myCamera.centerY)*0.2;
			
			myCamera.moveTo(myCamera.centerX - camDX, myCamera.centerY - camDY);
		}
		mouseScrolled = 0;
		
		// Press R to reset the camera
		
		if(kb.typed(kb.R))
		{
			myCamera.zoomToFit();
			graph.unhighlightAll();
		}
		
		
		
		// update the mouse
		
		myCamera.updateMouse(mouseX,mouseY);
		
		// begin drawing stuff

		if(graph.draw && (myCamera.needsRedraw || graph.needsRedraw))
		{
			mpClear(pen, myCamera);
			mpClear(edgePen, myCamera);
			
			pen.lineWidth = 3;
			mpCircle(edgePen,0,0,10,"#9999CC","#9999CC");
			mpRect(edgePen,0,0,viewWidth,viewHeight);
			
			graph.draw(myCamera);
			myCamera.needsRedraw = false;
			graph.needsRedraw = false;
		}
		
		graph.drawToolTip(mouseX,mouseY);

		
	//	mpText(bgpen, "( " + Math.floor(myCamera.mouseX) + " , " + Math.floor(myCamera.mouseY) + " )" ,10,10,"black","black");
	//	mpText(bgpen, "keycode: " + kb.lastPressed ,10,30,"black","black");
	//	mpText(bgpen, "redraw time: " + timer.getTime(),10,50,"black","black");
		
		mpImage(bgpen, hidpen.canvas ,0,0);
		
		// reset and start the redraw timer
		
		if(recording)
		{
			if(myMacro.iter == 0)
			{
				recording = false;
				displayDataWindow(numNodes, connectivity, times, "Interactive Redrawing", "Canvas");
			}
			else
			{
				var thisTime = timer.getTime();
				times[2+times[1]] = thisTime;
				times[0] += thisTime;
				times[1]++;
			}
		}
		timer.start();
		
		// if this was our first loop through, alert the user how long it took to initially render the graph.
		
		if(!firstDrawTimer.expired)
		{
			firstDrawTimer.expired = true;
			alert("Finished drawing the graph. Time(ms): " + firstDrawTimer.getTime());
		}
	}
	
	// schedule the next update loop
	
	setTimeout("updateCanvas()",20);
}


/* *
	myOnmousemove
	Handler method for onmousemove. Makes the camera follow the mouse whenever the mouse moves.
	Inputs: evt is the event object passed in by onmousemove.
	Postconditions: The internal mouse coordinates are updated and the center of the camera will be moved toward the mouse's 
		current location on the next update loop.
* */

function myOnmousemove(evt)
{
	if (!evt) evt = window.event;
	// get data for previous position of mouse and camera
	
	clickedX = myCamera.mouseX;
	clickedY = myCamera.mouseY;
	oldCenterX = myCamera.centerX;
	oldCenterY = myCamera.centerY;
	
	// get data for mouse's new position and update its world coordinates
	
	mouseX = evt.clientX - pen.canvas.offsetLeft;
	mouseY = evt.clientY - pen.canvas.offsetTop;
	
	myCamera.updateMouse(mouseX,mouseY);

	// pan the camera if the mouse is dragging the background
	if(!clickedNode && mouseHeld)
	{
		var mouseDX = myCamera.mouseX - clickedX;
		var mouseDY = myCamera.mouseY - clickedY;
		myCamera.moveTo(oldCenterX-mouseDX, oldCenterY-mouseDY);
	}
	
	// update the mouse's world coordinates after moving the camera
	
	myCamera.updateMouse(mouseX,mouseY);
	
	// drag-and-drop functionality for nodes

	if(clickedNode && mouseHeld)
	{
		graph.nodes[clickedNode].x = myCamera.mouseX;
		graph.nodes[clickedNode].y = myCamera.mouseY;
		graph.needsRedraw = true;
	}
	
	

}

/* *
	myOnclick
	Handler method for onclick. Calls the graph's neighbor highlighting feature upon whichever 
		node the mouse just clicked on. Does nothing if the user didn't click a node.
	Inputs: evt is the event object passed in by onclick.
	Postconditions: If a node was clicked, it and its neighbors' highlight flags are toggled. The results of this 
		will be shown on the next update loop.
* */

function myOnclick(evt)
{
	if (!evt) evt = window.event;
	graph.highlightFX(mouseX,mouseY);
}

/* *
	myOnmousedown
	Handler method for onmousedown. Implements click-and-drag camera panning and drag-and-drop for nodes.
	Inputs: evt is the event object passed in by onmousedown.
	Postconditions: If the user began this event by clicking on a node, then this will run drag-and-drop for that node.
		Otherwise it will run click-and-drag camera panning.
* */

function myOnmousedown(evt)
{
	if (!evt) evt = window.event;
	clickedNode = graph.getMouseNode(mouseX,mouseY);
	mouseHeld = true;
}

/* *
	myOnmouseup
	Handler method for onmouseup. Resets mouseHeld variable.
	Inputs: evt is the event object passed in by onmousedown.
	Postconditions: Resets mouseHeld variable.
* */

function myOnmouseup(evt)
{
	if (!evt) evt = window.event;
	mouseHeld = false;
}

/* *
	myOnmousewheel
	Handler method for the mouse's scrolling wheel. 
	Inputs: evt is the event object passed in by onclick.
	Postconditions: Data is stored for which direction the mouseScrolled in the mouseScrolled variable.
* */

function myOnmousewheel(evt)
{
	
	if (!evt) evt = window.event;
	// normalize the delta
	if (evt.wheelDelta)
	{
		// IE & Opera
		mouseScrolled = evt.wheelDelta / 120;
	}
	else if (evt.detail) // W3C
	{
		mouseScrolled = -evt.detail / 3;
	}

}
