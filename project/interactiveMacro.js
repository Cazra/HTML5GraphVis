/* *
 * interactiveMacro object
 * written by: Stephen Lindberg
 * Created: 7/25/11
 * Last modified: 7/25/11 by Stephen Lindberg
 * 
 * A macro that emulates a series of predefined mouse and keyboard events used for interactive data collection.
 * */

/* *
 * Constructor
 * Inputs: painterX and painterY are the coordinate offsets for the mouse. Canvas will need the upper-left corner 
 * 		coordinates of the canvas object, but SVG just needs (0,0). 
 * 		kb is the keyboard object used by the prototype.
 * 		graph is the graph object created by the prototype.
 * 		myCamera is the prototype's camera.
 * */

function interactiveMacro(painterX,painterY,kb, graph, myCamera)
{
	this.iter = 0;
	this.evt = new fakeEvent();
	this.painterX = painterX;
	this.painterY = painterY;
	this.kb = kb;
	this.graph = graph;
	this.camera = myCamera;
	
	// methods
	
	this.go = macroGo;
	this.setMouse = macroMouse;
	this.moveMouse = macroMoveMouse;
	this.resetKB = macroResetKB;
	this.keyPress = macroKeyPress;
}

	/* *
	 * fakeEvent helper object
	 * An object used for passing data for emulated mouse and keyboard events.
	 * */
	 
	function fakeEvent()
	{
		this.which = 0;
		this.clientX = 0;
		this.clientY = 0;
	}

/* *
 * macroGo
 * Runs the next emulation in the macro. If the macro hasn't started yet, then it starts from the beginning.
 * */

function macroGo()
{
	this.resetKB();
	console.log(this.iter);
	if(this.iter == 0)
	{
		this.keyPress(this.kb.R);
		this.setMouse(-20,-20);
		myOnmousedown(this.evt);
	}
	if(this.iter >=0 && this.iter < 5)
	{	
		this.moveMouse(-20,-20);
		this.keyPress(this.kb.EQUALS);
	}
	if(this.iter >=5 && this.iter < 9)
	{	
		this.moveMouse(20,20);
		this.keyPress(this.kb.MINUS);
	}
	if(this.iter == 9)
	{
		myOnmouseup(this.evt);
		this.keyPress(this.kb.R);
		var node = this.graph.nodes[0];
		var nodeT = this.camera.worldToCanvas(node.x,node.y);
		this.setMouse(nodeT[0],nodeT[1]);
		myOnmousedown(this.evt);
		this.setMouse(320,200);
		clickedNode = node.id;
		
	}
	if(this.iter >=9 && this.iter < 15)
	{
		this.keyPress(this.kb.EQUALS);
		this.moveMouse(20,10);
	}
	if(this.iter >=15)
	{
		this.keyPress(this.kb.EQUALS);
		this.moveMouse(-40,10);
	}
	
	// next iteration
	
	this.iter++;
	
	// this macro only uses 20 frames of input. After the 20th frame, reset the macro and reset the input controls.
	
	if(this.iter == 21)
	{
		this.iter = 0;
		myOnmouseup(this.evt);
		this.resetKB();
	}
}

/* *
 * macroMouse
 * sets the emulated mouse's position.
 * Inputs: x,y are the Canvas coordinates to set the emulated mouse to.
 * Postconditions: The emulated mouse is moved to (x,y) in canvas coordinates.
 * */

function macroMouse(x,y)
{
	this.evt.clientX = x + this.painterX;
	this.evt.clientY = y + this.painterY;
	myOnmousemove(this.evt);
}

/* *
 * macroMoveMouse
 * moves the emulated mouse relative to its current position.
 * Inputs: dx,dy are the units to move the mouse's current x and y coordinates, respectively.
 * Postconditions: The emulated mouse is moved (dx,dy) units.
 * */
 
function macroMoveMouse(dx,dy)
{
	this.evt.clientX += dx;
	this.evt.clientY += dy;
	myOnmousemove(this.evt);
}

/* *
 * macroResetKB
 * resets the emulated keyboard.
 * Postconditions: resets the emulated keyboard.
 * */

function macroResetKB()
{
	this.kb.keyPressed = [];
	this.kb.keyTyped = [];
}

/* *
 * macroKeyPress
 * mimics a key press on the emulated keyboard.
 * Inputs: keycode is the keycode of the keystroke to emulate
 * Postconditions: the emulated key matching keycode is pressed.
 * */
 
function macroKeyPress(keycode)
{
	this.evt.which = keycode;
	this.kb.setKeyDown(this.evt);
}

