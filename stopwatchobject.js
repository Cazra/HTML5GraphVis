/* *
 * StopWatch object
 * Written by: Stephen Lindberg
 * Created: 7/1/2011
 * Last modified: 7/19/2011 by Stephen Lindberg
 * */

/* *
 * Constructor
 * */

function StopWatch()
{
	this.curDate = new Date();
	this.lastDate = this.curDate.getTime();
	this.stoppedTime = this.lastDate;
	
	this.elapsedTime = 0;
	this.isRunning = false;
	
	this.start = stopwatchStart;
	this.getTime = stopwatchGetTime;
	this.pause = stopwatchPause;
	this.unpause = stopwatchUnpause;
}

/* *
 * stopwatchStart
 * Resets the stopwatch and begins timing.
 * Postconditions: resets the stopwatch to the current time and begins timing.
 * */

function stopwatchStart()
{
	this.curDate = new Date();
	this.lastDate = this.curDate.getTime();
	this.elapsedTime = 0;
	this.isRunning = true;
}

/* *
 * stopwatchGetTime
 * Returns the amount of time that has elapsed since stopwatchStart was last called.
 * Postconditions: Returns the amount of time that has elapsed since stopwatchStart was last called.
 * */

function stopwatchGetTime()
{
	if(this.isRunning)
	{
		this.curDate = new Date();
		this.elapsedTime = this.curDate.getTime() - this.lastDate;
	}
	else
	{
		this.elapsedTime = this.stoppedTime - this.lastDate;
	}	
	
	return this.elapsedTime;
}

/* *
 * stopwatchPause
 * Stops the stop watch
 * Postconditions: the stop watch is paused, but not reset.
 * */

function stopwatchPause()
{
	this.curDate = new Date();
	this.isRunning = false;
	this.stoppedTime = this.curDate.getTime();
}

/* *
 * stopwatchContinue
 * The stop watch continues timing after being paused.
 * Postconditions: The stop watch is unpaused.
 * */

function stopwatchUnpause()
{
	this.curDate = new Date();
	this.isRunning = true;
	this.lastDate += this.curDate.getTime() - this.stoppedTime;
}


