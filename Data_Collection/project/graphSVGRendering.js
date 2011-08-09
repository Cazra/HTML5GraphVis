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
	
	var mouseX = 0;
	var mouseY = 0;
	
	var kb;
	
	var timer;
	var firstDrawTimer;
	var serverTimer;
	
	var numNodes;
	var connectivity;
	
	var times = new Array();
	var timesIter;
	var timesLoops;
	
	/* *
		main
		This function is called when all the elements of the document are ready. It initializes all the objects for our
			application and then starts up the update loop.
		Postconditions: The application is started and enters the update loop.
	* */
	
//	$(window).load = svgInit;
	
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
		svgDocument = document.getElementById("svgEmbed").contentDocument;

        if(svgDocument)
        {
			
			// set up the Camera
			
			myCamera = new Camera(svgDocument,"SVG");
			
			// set up data collection stuff
			
			timesLoops = 20;
			times[0] = 0;
			times[1] = timesLoops;
			times[102] = 0; // total server time
			timesIter = 0;
			
			numNodes = sizesArr[graphSizeIndex];
			connectivity = conArr[conIndex];
		//	numNodes = prompt("How many nodes?");
		//	connectivity = prompt("How much connectivity? [0.0 , 1.0]");
			
			// make and render the first graph
			
			makeGraph();
		}
		else
		{
			setTimeout("svgInit();",20);
		}
	}
	
	
	/* *
		makeGraph
		Creates a new graph instance.
	* */
	
	function makeGraph()
	{
		// clean up node and edge elements from previous rendering
		if(graph)
		{
			var nodeGroup = graph.nodesGroupSVG;
			if(nodeGroup)
			{
				nodeGroup.parentNode.removeChild(nodeGroup);
				graph.nodesGroupSVG = null;
			}
			var edgeGroup = graph.edgesGroupSVG;
			if(edgeGroup)
			{
				edgeGroup.parentNode.removeChild(edgeGroup);
				graph.edgesGroupSVG = null;
			}
			graph.destroy();
		}
		
		jDataReadyFirstTime = true;
	
		// setup StopWatches
		timer = new StopWatch();
		firstDrawTimer = new StopWatch();
		serverTimer = new StopWatch();
		
		firstDrawTimer.expired = false;
		
		// Let's make a graph! :D
		graph = new Graph(svgDocument,"SVG");
		
		graph.readJSON([firstDrawTimer, serverTimer], numNodes, connectivity);
	
		// assign event handlers for tooltips
	
		svgDocument.drawToolTip = myDrawToolTip;
		svgDocument.eraseToolTip = myEraseToolTip;
		svgDocument.highlightFX = myHighlightFX;
		svgDocument.setHoverBg = mySetHoverBg;
		
		// enter the update loop
		
		updateSVG();
	}
	
			// interactivity functions do nothing in the Rendering prototype.
	
			function myDrawToolTip(nodeid)
			{
				//graph.drawToolTip(nodeid);
			}
			
			function myEraseToolTip(nodeid)
			{
				//graph.eraseToolTip(nodeid);
			}
			
			function myHighlightFX(nodeid)
			{
				//graph.highlightFX(nodeid);
			}
			
			function mySetHoverBg()
			{
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
				
			/*	var viewRect = svgDocument.getElementById("viewRect");
				viewRect.setAttribute("width",viewWidth);
				viewRect.setAttribute("height",viewHeight);*/
				
				jDataReadyFirstTime = false;
				
				myCamera.viewWidth = viewWidth;
				myCamera.viewHeight = viewHeight;
				
				myCamera.zoomToFit();
			}

			// update the mouse
			myCamera.updateMouse(mouseX,mouseY);
			
			// update the drawing
			
			var myTxt = svgDocument.getElementById("timerTxt");
			myTxt.firstChild.data = "render Time: " + times[timesIter + 1];
			myTxt = svgDocument.getElementById("graphTxt");
			myTxt.firstChild.data = "# Nodes: " + graph.numNodes + ", # Edges: " + graph.numEdges;
			myTxt = null;
			
			// reset and start our redraw timer.
			
			timer.start();
			
			// if this was our first time through the update loop, alert the user how long it took to initially render the graph.
			
			if(!firstDrawTimer.expired)
			{
				firstDrawTimer.expired = true;
				
				var thistime = firstDrawTimer.getTime();
				var servertime = serverTimer.getTime();
				
				times[timesIter+2] = thistime;
				times[0] += thistime;
				times[timesIter+103] = servertime;
				times[102] += servertime;
				timesIter++;
				if(timesIter < timesLoops)
				{
					setTimeout("makeGraph()",20);
					//console.clear();
				}
				else
				{	
					
					displayDataWindow(numNodes, connectivity, times, "Initial Rendering", "SVG");
					
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
			}
		}
		else
		{
			setTimeout("updateSVG()",20);
		}
	}
