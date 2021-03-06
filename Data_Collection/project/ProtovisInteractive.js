	// text/javascript+protovis
	
	var sizesArr = dataSets.sizes;
var conArr = dataSets.connectivities;
var urlArr = dataSets.setURLs;
	var dataCollectFinished = false;
	
	var graph;
	var jData;
	var jDataReadyFirstTime = true;

	var viewWidth;
	var viewHeight;
	
	var vis;

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

	function initPVPrototype() 
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
		
		// set up the Protovis panel
		var w = 640,
		h = 480,
		colors = pv.Colors.category19();
		
		vis = new pv.Panel()
			.def("i",-1)
			.canvas("PVview")
			.width(w)
			.height(h)
			.fillStyle("white")
		//	.event("mousedown", myOnmousedown)//pv.Behavior.pan())
		//	.event("mousewheel", pv.Behavior.zoom())
			.transform(pv.Transform.identity);

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
		
		// set up the camera
		
		myCamera = new Camera(vis,"Protovis");
		
		// mouse wheel event handlers
		
		document.onmousemove = myOnmousemove;
		document.onmouseup = myOnmouseup;
		document.onmousedown = myOnmousedown;
		
		// Mozilla
		if(window.addEventListener) document.addEventListener('DOMMouseScroll', myOnmousewheel, false);
		// IE/OPERA etc
		document.onmousewheel = myOnmousewheel;
		
		
		// set up the StopWatches
		timer = new StopWatch();
		firstDrawTimer = new StopWatch();
		
		firstDrawTimer.expired = false;
	
		// Let's make a graph! :D
		graph = new Graph(pv,"Protovis");
		
		// get graph input data from user.
		numNodes = sizesArr[graphSizeIndex];
		connectivity = conArr[conIndex];
	//	numNodes = prompt("How many nodes?");
	//	connectivity = prompt("How much connectivity? [0.0 , 1.0]");
		
		var pvViewer = document.getElementById("PVview");
		myMacro = new interactiveMacro(pvViewer.offsetLeft, pvViewer.offsetTop, kb, graph, myCamera);
		graph.readJSON(firstDrawTimer, numNodes, connectivity);

		// enter the update loop

		updateVis();
		
	}
	
	function updateVis()
	{
		if(graph.jsonReady)
		{
			if(jDataReadyFirstTime)
			{
				viewWidth = graph.jsonData.globalCoordinateInformation.width;
				viewHeight = graph.jsonData.globalCoordinateInformation.height;
				
				graph.draw();
				graph.force = vis.add(pv.Layout.Network)
					.width(1024)
					.height(1024)
					.nodes(graph.nodes)//pvJSONnodes)
					.links(graph.pvJSONedges);
					
				var force = graph.force;
				
				force.link.add(pv.Line)
					.strokeStyle("#000000")
					.lineWidth(3);

				force.node.add(pv.Dot)
					.size(1256)
					.strokeStyle(function(d) {return d.highlighted ? "#AA5500" : "#000000";})
					.fillStyle(function(d) {return d.highlighted ? "#CCCC00" : "#00AAFF";})
					.lineWidth(3)
					.title(function(d) {return d.nodeName;})
					.event("mousedown", function(d) {clickedNode = d.id;})
					.event("click", function(d) {graph.highlightFX(d.id); graph.needsRedraw = true;})
					;

				// set up the camera
				
				myCamera.viewWidth = viewWidth;
				myCamera.viewHeight = viewHeight;
				myCamera.zoomToFit();
				
				jDataReadyFirstTime = false;
			}
			
			// Press C to begin recording redraw times using input simulation macro
			
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
			
			// redraw everything to reflect changes.
			
			if(graph.draw && (myCamera.needsRedraw || graph.needsRedraw))
			{
				myCamera.needsRedraw = false;
				graph.needsRedraw = false;
				vis.render();
			}
			
			// reset and start the redraw timer
		
			if(recording)
			{
				if(myMacro.iter == 0)
				{
					recording = false;
					displayDataWindow(numNodes, connectivity, times, "Interactive Redrawing", "Protovis Baseline");
					
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
			
			// if this was our first loop through, alert the user how long it took to initially render the graph.
			
			if(!firstDrawTimer.expired)
			{
				firstDrawTimer.expired = true;
			//	alert("Finished drawing the graph. Time(ms): " + firstDrawTimer.getTime());
			}
		}

		setTimeout("updateVis();",20);
		
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
		
		var pvViewer = document.getElementById("PVview");
		
		mouseX = evt.clientX - pvViewer.offsetLeft;
		mouseY = evt.clientY - pvViewer.offsetTop;
		
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
		myOnmousedown
		Handler method for onmousedown. Activates click-and-drag camera panning.
		Inputs: evt is the event object passed in by onmousedown.
		Postconditions: If the user began this event by clicking on a node, then this will run drag-and-drop for that node.
			Otherwise it will run click-and-drag camera panning.
	* */

	function myOnmousedown(evt)
	{
		if (!evt) evt = window.event;
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
		clickedNode = null;
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

	
	// Start the application
	
	initPVPrototype();
