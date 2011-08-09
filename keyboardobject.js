/* *
 * Keyboard object
 * Written by Stephen Lindberg
 * Created: 6/30/2011
 * Last modified: 7/1/2011 by Stephen Lindberg
 * 
 * A module for handling keyboard input. To use this object, just create a new instance of it 
 * and have your script's onkeydown and onkeyup event handlers pass on their event object to 
 * the keyboard object's setKeyDown and setKeyUp methods, respectively. 
 * */

/* *
 * constructor
 * */

function Keyboard()
{
	this.keyPressed = new Array();
	this.keyTyped = new Array();
	this.lastPressed = 0;
	
	// keycode constants
	
	this.A = 65;
	this.C = 67;
	this.R = 82;
	this.S = 83;
	this.W = 87;
	this.Q = 81;
	this.MINUS = 109;
	this.EQUALS = 61;
	
	// event handlers
	
	this.setKeyDown = keyboardSetKeyDown;
	this.setKeyUp = keyboardSetKeyUp;
	
	// methods
	
	this.pressed = keyboardPressed;
	this.typed = keyboardTyped;

}

/* *
 * keyboardSetKeyDown
 * Event handler method for onkeydown.
 * Inputs: evt is the event object passed in by your script's onkeydown event handler.
 * Postconditions: The Keyboard object marks this key as being held down.
 * */

function keyboardSetKeyDown(evt)
{
	var thiskey;
	if(evt.which)
		thiskey = evt.which;
	else
		thiskey = evt.keyCode;
	
	this.keyPressed[thiskey] = true;

	this.lastPressed = thiskey;
}

/* *
 * keyboardSetKeyUp
 * Event handler method for onkeyup.
 * Inputs: evt is the event object passed in by your script's onkeyup event handler.
 * Postconditions: The Keyboard object marks this key as being released.
 * */

function keyboardSetKeyUp(evt)
{
	var thiskey;
	if(evt.which)
		thiskey = evt.which;
	else
		thiskey = evt.keyCode;
	
	this.keyPressed[thiskey] = false;
	this.keyTyped[thiskey] = false;
}

/* *
 * keyboardPressed
 * Tests to see if a key is being held down.
 * Inputs: The key code for the key we're checking.
 * Postconditions: Returns true if the key is being held down. Returns false otherwise.
 * */
 
function keyboardPressed(keycode)
{
	if(this.keyPressed[keycode])
		return true;
	else
		return false;
}

/* *
 * keyboardTyped
 * Tests to see if a key is typed.
 * Inputs: The key code for the key we're checking.
 * Postconditions: Returns true if the key is registered as pressed for the first time 
 * 		since it was last released. Returns false otherwise.
 * */

function keyboardTyped(keycode)
{
	if(this.keyPressed[keycode] && !this.keyTyped[keycode])
	{
		this.keyTyped[keycode] = true;
		return true;
	}
	else
		return false;
}


