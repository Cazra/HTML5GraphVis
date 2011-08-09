/*
		graphPrototypeCanvas.html
		Written by: Stephen Lindberg
		Created: 6/28/11
		Last modified: 7/29/11
	*/
	var sizesArr = dataSets.sizes;
var conArr = dataSets.connectivities;
var urlArr = dataSets.setURLs;
	var dataCollectFinished = false;

	var graph;
	var jData;
	var jDataReadyFirstTime = true;
	
	var viewWidth;
	var viewHeight;

	var pen;
	var edgePen;
	var bgPen;
	var hidPen;
	
	var myCamera;
	
	var bgPtrn;
	
	var mouseX = 0;
	var mouseY = 0;
	var mouseClicked = false;
	
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
	
	$(document).ready(function()
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
		
		// get contexts for our canvases
		var c = document.getElementById("edgeGroup");
		edgePen = c.getContext("2d");
		c = document.getElementById("nodeGroup");
		pen = c.getContext("2d");
		c = document.getElementById("bgCanvas");
		bgpen = c.getContext("2d");
		c = document.getElementById("canvasHidden");
		hidpen = c.getContext("2d");
		
		// create background pattern
		
		var ptrnImg = document.createElement("canvas");
		var ptrnPen = ptrnImg.getContext("2d");
		ptrnImg.width = 32;
		ptrnImg.height = 32;
		
		mpRect(ptrnPen,0,0,16,16,"lightblue","lightblue");
		mpRect(ptrnPen,16,16,16,16,"lightblue","lightblue");
		
		bgPtrn = new mpPattern(ptrnImg, "repeat",0,0,32,32);
		
		// set up the camera
		
		myCamera = new Camera([edgePen,pen]);
		myCamera.moveTo(320,240);
		
		
		timesLoops = 20;
		times[0] = 0; // total rendering time
		times[1] = timesLoops; // number of renderings
		times[102] = 0; // total server time
		timesIter = 0;
		
		numNodes = sizesArr[graphSizeIndex];
		connectivity = conArr[conIndex];
	//	numNodes = prompt("How many nodes?");
	//	connectivity = prompt("How much connectivity? [0.0 , 1.0]");
		
		makeGraph();
		
	});
	
	/* *
		makeGraph
		Creates a new graph instance.
	* */
	
	function makeGraph()
	{
		jDataReadyFirstTime = true;
		
		// set up the StopWatches
		timer = new StopWatch();
		firstDrawTimer = new StopWatch();
		serverTimer = new StopWatch();
		
		firstDrawTimer.expired = false;
		
		// Let's make a graph! :D
		if(graph)
			graph.destroy();
		graph = new Graph(document);
		graph.readJSON([firstDrawTimer, serverTimer], numNodes, connectivity);

		// enter the update loop

		updateCanvas();
	}
	
	
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
				
				jDataReadyFirstTime = false;
				
				myCamera.viewWidth = viewWidth;
				myCamera.viewHeight = viewHeight;
				
				myCamera.zoomToFit();
				
			}
			
			// Draw a background using our pattern
			mpClear(bgpen,"white");
			mpClear(bgpen,bgPtrn);

			// update the mouse
			
			myCamera.updateMouse(mouseX,mouseY);
			
			// begin drawing stuff
			
			mpClear(pen, myCamera);
			mpClear(edgePen, myCamera);
			
			pen.lineWidth = 3;
			mpCircle(pen,0,0,10,"#9999CC","#9999CC");
			mpRect(pen,0,0,viewWidth,viewHeight);
			
			if(graph.draw)
			{
				graph.draw(myCamera);
			}
			
		//	graph.drawToolTip(mouseX,mouseY);
			
			mpText(bgpen, "render time: " + times[timesIter + 1],10,50,"black","black");
			if(timesIter != 0)
				mpText(bgpen, "# Nodes: " + graph.numNodes + ", # Edges: " + graph.numEdges ,10,70,"black","black");
			
			mpImage(bgpen, hidpen.canvas ,0,0);
			
			// reset and start the redraw timer
			
			timer.start();
			
			// if this was our first loop through, alert the user how long it took to initially render the graph.
			
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
				}
				else
				{	
				
					displayDataWindow(numNodes, connectivity, times, "Initial Rendering", "Canvas");
					
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
			setTimeout("updateCanvas()",20);
		}
	}
