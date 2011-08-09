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
	
	var vis = null;
	var force = null;

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
			.transform(pv.Transform.identity);
		
		// set up the camera
		
		myCamera = new Camera(vis,"Protovis");
		myCamera.moveTo(320,240);
		
		
		timesLoops = 5;
		times[0] = 0; // total rendering time
		times[1] = timesLoops; // number of renderings
		times[102] = 0; // total server time
		timesIter = 0;
		
		
		// get graph input data from user.
		numNodes = sizesArr[graphSizeIndex];
		connectivity = conArr[conIndex];
	//	numNodes = prompt("How many nodes?");
	//	connectivity = prompt("How much connectivity? [0.0 , 1.0]");

		// enter the update loop

		makeGraph();
	}
	
	
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
		
		// clean up after last graph
		
		if(graph)
		{
			graph.destroy();
			force.nodes(null);
			force.links(null);
			
		}
		else
		{
			force = vis.add(pv.Layout.Network)
				.width(1024)
				.height(1024);
			force.link.add(pv.Line)
				.strokeStyle("#000000")
				.lineWidth(3);

			force.node.add(pv.Dot)
				.size(1256)
				.strokeStyle(function(d) {return d.highlighted ? "#AA5500" : "#000000";})
				.fillStyle(function(d) {return d.highlighted ? "#CCCC00" : "#00AAFF";})
				.lineWidth(3)
				.title(function(d) {return d.nodeName;})
				;
		}
		
		// Let's make a graph! :D
		graph = new Graph(pv,"Protovis");
		graph.readJSON([firstDrawTimer, serverTimer], numNodes, connectivity);

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
				
				force.nodes(graph.nodes);
				force.links(graph.pvJSONedges);
				
				force.reset();
				// set up the camera
				
				myCamera.viewWidth = viewWidth;
				myCamera.viewHeight = viewHeight;
				myCamera.zoomToFit();
				
				jDataReadyFirstTime = false;
			}
			
			// redraw everything to reflect changes.
			
			
			vis.render();
			
			
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
				
					displayDataWindow(numNodes, connectivity, times, "Initial Rendering", "Protovis");
					
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
			setTimeout("updateVis()",20);
		}
		
	}

	
	// Start the application
	
	initPVPrototype();
