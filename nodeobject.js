/* *
 * Node object
 * written by: Stephen Lindberg
 * Created: 6/21/11
 * Last modified: 7/28/11
 * 
 * */

/* *
 * constructor
 * Inputs: x is the x coordinate where the node will be rendered. y is its y coordinate.
 * 		id is a string representing a unique id for this node.
 * */

function Node(x,y,id,label)
{
	this.x = x;
	this.y = y;
	this.id = id;
	this.numEdges = 0;
	this.edges = new Array();
	this.drawnEdges = new Array();
	this.edgeSprites = new Array(); // only used by SVG
	
	if(label)
		this.label = label;
	else
		this.label = id;
	
	this.addEdge = nodeAddEdge;
	this.hasEdge = nodeHasEdge;
	this.destroy = nodeDestroy;
//	this.drawSVG = nodeDrawSVG;
//	this.drawEdgesSVG = nodeDrawEdgesSVG;
}

/* *
 * nodeDestroy
 * Destructor
 * */

function nodeDestroy()
{
	this.edges = null;
	this.drawnEdges = null;
	this.edgeSprites = null;
}

/* *
 * nodeAddEdge
 * Creates an edge between this node and another node.
 * Inputs: node is another node object.
 * Postconditions: a bidirectional edge is established between this and node.
 * */

function nodeAddEdge(node)
{
	if(this.edges[node.id] == null)
	{
		this.edges[node.id] = node;
		node.addEdge(this);
		this.numEdges++;
	}
}

/* *
 * nodeHasEdge
 * Inputs: node is another node object.
 * Postconditions: Returns true if this has an edge to node. False otherwise.
 * */

function nodeHasEdge(node)
{
	if(this.edges[node.id])
		return true;
	return false;
}





