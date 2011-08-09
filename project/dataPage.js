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
	pageStr += "</body></html>";
	dataCollectWindow.document.write(pageStr);
	dataCollectWindow.focus();
	
	dataCollectWindow.document.onload = new function(evt){dataCollectWindow.print();};
}


