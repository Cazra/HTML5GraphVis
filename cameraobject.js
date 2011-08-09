
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
 
