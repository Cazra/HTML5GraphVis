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




