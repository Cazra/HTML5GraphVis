/*
		graphPrototypeSVG.html
		Written by: Stephen Lindberg
		Created: 6/21/11
		Last modified: 7/29/11
	*/

	var sizesArr = dataSets.sizes;
var conArr = dataSets.connectivities;
var urlArr = dataSets.setURLs;
	var dataCollectFinished = false;

	var graph = null;
	var svgDocument;
	
	var jDataReadyFirstTime = true;
	var viewWidth;
	var viewHeight;
	
	var myCamera;
	var oldCenterX;
	var oldCenterY;
	
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
	
	var times = new Array();
	var timesIter;
	var recording = false;
	var myMacro;
	
	/* *
		main
		This function is called when all the elements of the document are ready. It initializes all the objects for our
			application and then starts up the update loop.
		Postconditions: The application is started and enters the update loop.
	* */
	
	$(document).ready(function()
	{
		svgInit();
	});
	
		
	function svgInit()
	{
		var graphSizeIndex = sessionStorage.getItem("sizeIndex");
		if(!graphSizeIndex)
		{
			sessionStorage.setItem("sizeIndex",0);
			graphSizeIndex=0;
		}
		var conIndex = sessionStorage.getItem("conIndex");
		if(!conIndex)
		{
			sessionStorage.setItem("conIndex",0);
			conIndex = 0;
		}
		var urlIndex = sessionStorage.getItem("urlIndex");
		if(!urlIndex)
		{
			sessionStorage.setItem("urlIndex",0);
			urlIndex = 0;
		}
		
		// get a pointer to the SVG document
		svgDocument = document.getElementById("svgEmbed").getSVGDocument();

        if(svgDocument)
        {
			// set up the Camera
			
			myCamera = new Camera(svgDocument,"SVG");
			
			// set camera panning handler
			
			svgDocument.onmousemove = myOnmousemove;
			svgDocument.onclick = myOnclick;
			svgDocument.onmousedown = myOnmousedown;
			svgDocument.onmouseup = myOnmouseup;
			
			// Mozilla
			if(window.addEventListener) svgDocument.addEventListener('DOMMouseScroll', myOnmousewheel, false);
			// IE/OPERA etc
			svgDocument.onmousewheel = myOnmousewheel;
			
			// set up the Keyboard
			
			kb = new Keyboard();
			svgDocument.onkeydown = function(evt)
			{
				if(evt)
					kb.setKeyDown(evt);
				else
					kb.setKeyDown(window.event);
			};
			svgDocument.onkeyup = function(evt)
			{
				if(evt)
					kb.setKeyUp(evt);
				else
					kb.setKeyUp(window.event);
			};
			
			// setup StopWatches
			timer = new StopWatch();
			firstDrawTimer = new StopWatch();
			firstDrawTimer.expired = false;
			

			// Let's make a graph! :D
			graph = new Graph(svgDocument,"SVG");
			
			numNodes = sizesArr[graphSizeIndex];
			connectivity = conArr[conIndex];
		//	numNodes = prompt("How many nodes?");
		//	connectivity = prompt("How much connectivity? [0.0 , 1.0]");
			myMacro = new interactiveMacro(0,0, kb, graph, myCamera);
			graph.readJSON(firstDrawTimer, numNodes, connectivity);
		
			// assign event handlers for tooltips
		
			svgDocument.drawToolTip = function(nodeid) // onmouseover handler for SVG nodes
			{
				graph.drawToolTip(nodeid);
				graph.hoverNode = nodeid;
			};
			svgDocument.eraseToolTip = function(nodeid)
			{
				graph.hoverNode = null;
				graph.eraseToolTip(nodeid);
			};
			svgDocument.highlightFX = function(nodeid)
			{
				graph.highlightFX(nodeid);
			};
			svgDocument.setHoverBg = function()
			{
				graph.hoverNode = null;
			};
			
			// enter the update loop
			
			updateSVG();
		}
		else
		{
			setTimeout("svgInit()",20);
		}
		
	}
	
	/* *
		updateSVG
		The main timer loop of the application. This method handles all interactivity and takes care of drawing the
			graph in SVG on the first loop through.
		Postconditions: The application is updated and is scheduled to be updated again after 20 ms. If this was the first
			time through the loop an alert message will be displayed to inform the user how long it took to initially render the 
			graph.
	* */
	
	function updateSVG()
	{
		
		if(graph.jsonReady) // do not continue until the JSON data is ready.
		{
			// in SVG the graph only needs to be drawn once on our first time through the update loop. 
			
			if(jDataReadyFirstTime)
			{
				if(graph.draw)
					graph.draw();
				
				viewWidth = graph.jsonData.globalCoordinateInformation.width;
				viewHeight = graph.jsonData.globalCoordinateInformation.height;
				
				var viewRect = svgDocument.getElementById("viewRect");
				viewRect.setAttribute("width",viewWidth);
				viewRect.setAttribute("height",viewHeight);
				
				myCamera.viewWidth = viewWidth;
				myCamera.viewHeight = viewHeight;
				
				myCamera.zoomToFit();
				
				jDataReadyFirstTime = false;
				
				console.log("resized view rectangle");
			}
			
			// Press C to begin recording redraw times
			
			if(myMacro.iter > 0)
			{
				myMacro.go();
			}
			if(firstDrawTimer.expired && !recording && !dataCollectFinished) // kb.pressed(kb.C)
			{
				times[0] = 0; // total time
				times[1] = 0; // number of recordings
				recording = true;
				
				myMacro.go();
			}
			
			// camera zoom controls
			
			if(kb.keyPressed[kb.W])
				myCamera.zoomTo(myCamera.zoom + myCamera.zoom*0.05);
			if(kb.keyPressed[kb.S])
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
			
			// update the drawing
			
			var myTxt = svgDocument.getElementById("debugTxt");
			myTxt.firstChild.data = "( " + Math.floor(myCamera.mouseX) + " , " + Math.floor(myCamera.mouseY) + " )";
			myTxt = svgDocument.getElementById("keyCodeTxt");
			myTxt.firstChild.data = "key pressed: " + kb.lastPressed;
			myTxt = svgDocument.getElementById("timerTxt");
			myTxt.firstChild.data = "redraw Time: " + timer.getTime();
			myTxt = svgDocument.getElementById("graphTxt");
			myTxt.firstChild.data = "# Nodes: " + graph.numNodes + ", # Edges: " + graph.numEdges;
			
			// reset and start our redraw timer.
			
			if(recording)
			{
				if(myMacro.iter == 0)
				{
					recording = false;
					displayDataWindow(numNodes, connectivity, times, "Interactive Redrawing", "SVG");
					
					// automation code
				
					//	alert("Finished drawing the graph. Time(ms): " + firstDrawTimer.getTime());
					var graphSizeIndex = sessionStorage.getItem("sizeIndex");
					var conIndex = sessionStorage.getItem("conIndex");
					var urlIndex = sessionStorage.getItem("urlIndex");
				//	alert("size:" + sizesArr[graphSizeIndex] +"\n" + "con: " + conArr[conIndex]);
					conIndex++;
					if(conIndex > 2)
					{
						conIndex = 0;
						graphSizeIndex++;
					}
					
					
					if(graphSizeIndex >= sizesArr.length)
					{
						urlIndex++;
						//window.location.reload();
						graphSizeIndex = 0;
						
					}
					sessionStorage.setItem("sizeIndex",graphSizeIndex);
					sessionStorage.setItem("conIndex",conIndex);
					sessionStorage.setItem("urlIndex",urlIndex);
					
					window.location.href = urlArr[urlIndex];
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
			
			// if this was our first time through the update loop, alert the user how long it took to initially render the graph.
			
			if(!firstDrawTimer.expired)
			{
				firstDrawTimer.expired = true;
			//	alert("Finished drawing the graph. Time(ms): " + firstDrawTimer.getTime());
			}
		}
		
		// schedule the next update loop
		
		setTimeout("updateSVG()",20);
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
		
		mouseX = evt.clientX;
		mouseY = evt.clientY;
		
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
			var nodeSprite = svgDocument.getElementById(clickedNode);
			nodeSprite.setAttribute("cx",myCamera.mouseX);
			nodeSprite.setAttribute("cy",myCamera.mouseY);
			
			var node = graph.nodes[clickedNode];
			node.x = myCamera.mouseX;
			node.y = myCamera.mouseY;
			
			var i;
			var edgeSprites = graph.nodes[clickedNode].edgeSprites
			for(i in edgeSprites)
			{
				var edgeSprite = edgeSprites[i];
				var other = graph.nodes[i];
				edgeSprite.setAttributeNS(null, "x1", node.x);
				edgeSprite.setAttributeNS(null, "y1", node.y);
				edgeSprite.setAttributeNS(null, "x2", other.x);
				edgeSprite.setAttributeNS(null, "y2", other.y);
			}
			graph.eraseToolTip(clickedNode);
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
	//	graph.highlightFX(mouseX,mouseY);
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
		clickedNode = graph.hoverNode;
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
