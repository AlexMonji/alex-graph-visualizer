import DOMNode from "./CustomElements/DOMNode.js"
import DOMRow from "./CustomElements/DOMRow.js"
import {BFS, DFS} from "./algorithms.js"

let animationQueue = [];
let animationProgress = null;
let prevAnimationIndex = 0;
let animationIndex = 0;
let currAnimation = null;
let currAlgorithm = null;

// nodes
let nodes = [];
let startNode = null;
let endNode = null;
let hasVisitedNodes = false;

let previousPath = []; // keep track of previous path for efficient clear

class StateMachine {
    constructor (initialState) {
        this.state = initialState;
        this.prevState = null;
        this.mouseState = {leftMouseDown: false, rightMouseDown: false};
        this.handleMouseState = this.handleMouseState.bind(this);
    }

    transition(state) {
        // attempt to transition to next state
        let nextState = this.state.transitions[state.name]
        
        // if next state doesn't exist, show default error and don't transition
        if (!nextState) {
            alert(`No transition ${this.state.name} => ${state.name}`);
            return;
        }
        // if next state has an error, call its error function and don't transition
        if (nextState.error) { 
            nextState.error();
            return
        }
        
        if (nextState.animation) {
            nextState.animation();
        }

        if (nextState.prepareForTransition) {
            nextState.prepareForTransition();
        }
        
        if (this.state != APPSTATE[state.name]) this.prevState = this.state; // don't set prevState if next state is the same as current
        this.state = APPSTATE[state.name];
        console.log(this.state.name);
    }

    handleMouseState(evt) {
        this.mouseState.leftMouseDown = false;
        this.mouseState.rightMouseDown = false;

        switch(evt.buttons) {
            case 1: 
                this.mouseState.leftMouseDown = true;
                break;
            case 2: 
                this.mouseState.rightMouseDown = true;
                break;
        }
    }
}

// global app state
const APPSTATE = Object.freeze({
    IDLE: {
        name: "IDLE", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION"}
        }
    },
    MOVE_START: {
        name: "MOVE_START", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PAUSE: {name: "PAUSE"}
        }
    }, 
    MOVE_END: {
        name: "MOVE_END", 
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PAUSE: {name: "PAUSE"}
        }
    }, 
    PLAYING_ANIMATION: {
        name: "PLAYING_ANIMATION", 
        transitions: {
            PLAYING_ANIMATION: {
                name: "PLAYING_ANIMATION",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            PAUSE: {
                name: "PAUSE",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            IDLE: {
                name: "IDLE",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            MOVE_END: {
                name: "MOVE_END",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            MOVE_START: {
                name: "MOVE_START",
                prepareForTransition: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            }
        }
    }, 
    PAUSE: {
        name: "PAUSE", 
        transitions: {
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION"},
            PAUSE: {name: "PAUSE"},
            IDLE: {name: "IDLE"},
            MOVE_END: {name: "MOVE_END"},
            MOVE_START: {name: "MOVE_START"},
        }
    }, 
});

const stateMachine = new StateMachine(APPSTATE.IDLE);

function SetStartNode(newStartNode, currStartNode) {
    if (newStartNode == currStartNode) return currStartNode; // if already set, don't do anything
    if (currStartNode) currStartNode.setIsStart(false);
    newStartNode.setIsStart(true);
    return newStartNode;
}

function SetEndNode(newEndNode, currEndNode) {
    if (newEndNode == currEndNode) return currEndNode; // if already set, don't do anything
    if (currEndNode) currEndNode.setIsEnd(false);
    newEndNode.setIsEnd(true);
    return newEndNode;
}

function GenerateGrid() {
    // get grid dimensions
    const nodes = [];
    const grid = document.getElementById("grid");
    const {width, height} = grid.getBoundingClientRect();
    const nodeSize = 24;

    // // clear children
    // while (this.grid.firstChild) {
    //     this.grid.removeChild(grid.firstChild);
    // }

    // make rows and cols odd in number
    const rows = Math.floor(height/nodeSize) % 2 ? Math.floor(height/nodeSize) : Math.floor(height/nodeSize)-1;
    const cols = Math.floor(width/nodeSize) % 2 ? Math.floor(height/nodeSize) : Math.floor(width/nodeSize)-1;

    // generate nodes and DOM for nodes
    for (let row = 0; row < rows; row++) {
        const nodeRow = [];
        const newDOMRow = document.createElement("tr"); // DOM grid
        for (let col = 0; col < cols; col++) {
            const newNode = new Node(row, col, nodes);

            // DOM Node setup
            const newDOMNode = newNode.DOMNode;
            newDOMNode.addEventListener("mouseenter", (evt) => NodeMouseEnter(evt, newNode));
            newDOMNode.addEventListener("mousedown",  (evt) => NodeMouseDown(evt, newNode));
            newDOMNode.setAttribute('size', nodeSize);
            newDOMRow.appendChild(newDOMNode);

            // Internal Node
            nodeRow.push(newNode);
            
            // set start and end node
            if (row == parseInt(rows/2) && col == parseInt(cols/4)) startNode = SetStartNode(newNode, startNode);
            if (row == parseInt(rows/2) && col == parseInt(3*cols/4)) endNode = SetEndNode(newNode, endNode);
        }
        nodes.push(nodeRow);
        grid.append(newDOMRow);
    }

    return nodes;
}

//Node(row, col)
//  clearAttributes(node)
//  getNeighbors(node)
//  getDOMNode(node)
class Node {
    constructor(row, col, nodes) {
        this.id = `${row}_${col}`
        this.DOMNode = new DOMNode(this);
        this.nodes = nodes;
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.direction = null;
        this.visited = false;
        this.from = null; // the neighbor that visited this node 
    }

    getNeighbors() {
        const {row, col} = this;
        const nodes = this.nodes;
        const neighbors = [];
        const colLength = nodes[0].length;
        const rowLength = nodes.length
        let neighbor = null;
        if (col+1 < colLength) {
            neighbor = nodes[row][col+1];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "left";
                neighbors.push( neighbor );
            }
        }
        if (row+1 < rowLength) {
            neighbor = nodes[row+1][col];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "above";
                neighbors.push( neighbor );
            }
        }
        if (col-1 >= 0) {
            neighbor = nodes[row][col-1];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "right";
                neighbors.push( neighbor );
            }
        }
        if (row-1 >= 0) {
            neighbor = nodes[row-1][col];
            if (!neighbor.visited) {
                neighbor.from = this;
                neighbor.direction = "below";
                neighbors.push( neighbor );
            }
        }
        return neighbors;
    }
    
    clearAttributes() {
        this.DOMNode.isStart = false;
        this.DOMNode.isEnd = false;
        this.DOMNode.isWall = false;
    }

    setVisited(value, animate = true) {
        this.DOMNode.setVisited(value, this.direction, animate);
    }

    setPath(value, animate = true) {
        if (animate) this.DOMNode.setPath(value, this.direction);
        else this.DOMNode.setPath(value, "none");     
    }

    setIsWall(value) {
        this.DOMNode.isWall = value;
        this.isWall = value;
    }

    setIsStart(value) {
        this.DOMNode.isStart = value;
    }

    setIsEnd(value) {
        this.DOMNode.isEnd = value;
    }

    clearAnimate() {
        this.DOMNode.clearAnimate();
    }
}

// main
window.addEventListener("DOMContentLoaded", function() {

    const grid = null; // remove after refactor
    nodes = GenerateGrid();

    // prevent contentmenu on node right click
    document.oncontextmenu = function(evt){
        if (evt.target instanceof DOMNode) {
            evt.preventDefault();
        }
    }
    document.onmouseup = handleMouseUp;

    // user actions
    // const gridSize = document.getElementById("grid-size");
    // gridSize.onchange = (evt) => grid.handleGridSize(evt.target.value);
    const playButton = document.getElementById("play-button");
    playButton.onclick = () => handlePlay(grid);
    animationProgress = document.getElementById("animation-progress");
    animationProgress.onchange = (evt) => handleAnimationProgress(evt.target.value);
    animationProgress.oninput = (evt) => {
        UpdateAnimationProgressBar(evt.target.value)
    };
    const BFSButton = document.getElementById("algorithm-BFS");
    BFSButton.onclick = () => RunAlgorithm(BFS);
    const DFSButton = document.getElementById("algorithm-DFS");
    DFSButton.onclick = () => RunAlgorithm(DFS);
    const clearButton = document.getElementById("clear-button");
    clearButton.onclick = () => Clear(grid);
    const resetButton = document.getElementById("reset-button");
    resetButton.onclick = () => Reset(grid);
});

// Node Logic Handlers
function NodeMouseEnter(event, node) {
    stateMachine.handleMouseState(event); // update mouse state before doing anything
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;
    
    // wall drawing
    switch(stateMachine.state) {
        case APPSTATE.PAUSE:
            //if ((leftMouseDown || rightMouseDown) && hasVisitedNodes) ClearVisited(); // if you try to draw a wall while paused, clear out the board
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            if (leftMouseDown || rightMouseDown) InstantAnimate();
            break;
        case APPSTATE.IDLE:
            if (leftMouseDown && node != startNode && node != endNode) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            break;
        case APPSTATE.MOVE_START:
            if (node != endNode && !node.isWall) startNode = SetStartNode(node, startNode);
            if (currAlgorithm) InstantAnimate();
            break;
        case APPSTATE.MOVE_END:
            if (node != startNode && !node.isWall) endNode = SetEndNode(node, endNode);
            if (currAlgorithm) InstantAnimate();
            break;
    }
}

function NodeMouseDown(event, node) {
    stateMachine.handleMouseState(event);
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;

    if (node == startNode) { stateMachine.transition(APPSTATE.MOVE_START); } 
    if (node == endNode) { stateMachine.transition(APPSTATE.MOVE_END); }

    switch(stateMachine.state) {
        // wall drawing
        case APPSTATE.IDLE:
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            break;
        case APPSTATE.PLAYING_ANIMATION:
            stateMachine.transition(APPSTATE.PAUSE);
        case APPSTATE.PAUSE:
            //if (hasVisitedNodes) ClearVisited();
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            InstantAnimate();

        default:
            break;
    }
}

function handleMouseUp(evt){
    switch(stateMachine.state) {
        case APPSTATE.MOVE_END:
        case APPSTATE.MOVE_START:
            // don't go back to playing animation since we instant animated
            if (stateMachine.prevState == APPSTATE.PLAYING_ANIMATION) {
                stateMachine.transition(APPSTATE.PAUSE);
                return;
            }
            stateMachine.transition(stateMachine.prevState);
            break;
        default:
            break;
    }
}

function RunAlgorithm(algorithm) {
    currAlgorithm = algorithm;
    // clean up visited nodes and reset animations & animation progress
    ClearVisited();
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
    
    // run algorithm and then animate
    animationQueue = algorithm(startNode, endNode);
    const path = CreatePath(endNode)
    previousPath = path;
    animationQueue = animationQueue.concat(path); 
    animationProgress.max = animationQueue.length;
    hasVisitedNodes = true;
    currAnimation = setInterval(AnimateSearch, 5);
    animationProgress.focus();
}

// animate algorithm search
function AnimateSearch() {
    if (animationIndex < animationQueue.length) {
        animationProgress.value++;
        const { node, type } = animationQueue[animationIndex++];
        type == "visit" ? node.setVisited(true) : node.setPath(true);
        prevAnimationIndex = animationIndex;
        UpdateAnimationProgressBar();
    } else {
        clearInterval(currAnimation);
    }
}


// when animation progress is handled by user
function handleAnimationProgress(value) {
    animationProgress.value = value;
    UpdateAnimationProgressBar();
    
    hasVisitedNodes = true;
    if (stateMachine.state != APPSTATE.PAUSE) stateMachine.transition(APPSTATE.PAUSE);

    // if single stepping with arrow keys
    if (animationIndex == value-1) {
        const {node, type} = animationQueue[animationIndex];
        type == "visit" ? node.setVisited(true) : node.setPath(true);

    }
    else if (animationIndex == value+1) {
        const {node, type} = animationQueue[animationIndex];
        type == "visit" ? node.setVisited(false) : node.setPath(false);
    }

    // if jumping to a point in the animation, go over entire queue to be safe since repaint is async
    else {
        for (let x = 0; x < value; x++) {
            const {node, type} = animationQueue[x];
            // don't animate to prevent lag
            type == "visit" ? node.setVisited(true, false) : node.setPath(true, false);
        }
        for (let x = value; x < animationQueue.length; x++) {
            const {node, type} = animationQueue[x];
            type == "visit" ? node.setVisited(false, false) : node.setPath(false, false);
        }
    }
    animationIndex = value;
}


// when start or end node is updated, immediately show search result
function InstantAnimate() {
    // start fresh and run algorithm
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.visited = false;
        node.from = null; 
        node.isPath = false;
    }));

    // clear previous path
    previousPath.forEach(({node, type}) => {
        node.setPath(false, false)
    });

    // create path and set animationQueue incase user wants to jump to an earlier point
    animationQueue = currAlgorithm(startNode, endNode);
    previousPath = CreatePath(endNode);
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.visited) {
            node.clearAnimate();
            node.setVisited(true, false)
        } else {
            node.setVisited(false, false);
        }
        if (node.isPath) {
            node.setPath(true, false);
        }
    }))
    animationQueue = animationQueue.concat(previousPath); 
    animationProgress.max = animationQueue.length;
    animationProgress.value = animationQueue.length;
    UpdateAnimationProgressBar();

    hasVisitedNodes = true;
}

// play button handler, get rid of this eventually
function handlePlay(grid) {
    grid.hasVisitedNodes = true;
    const playButton = document.getElementById("play-button");
    const animationProgress = document.getElementById("animation-progress");
    console.log("arf", stateMachine.state);
    if (stateMachine.state == APPSTATE.IDLE) {
        playButton.innerHTML = "Pause";
    } else if (stateMachine.state == APPSTATE.PLAYING_ANIMATION) {
        stateMachine.transition(APPSTATE.PAUSE);
        clearInterval(currAnimation);
        currAnimation = null;
        playButton.innerHTML = "Play";
    } else if (stateMachine.state == APPSTATE.PAUSE) {
        stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
        playButton.innerHTML = "Pause";
        currAnimation = setInterval(AnimateSearch, 5);
    }
}

// figure out the path
function CreatePath(endNode) {
    let node = endNode;
    let pathQueue = [];
    while (node.from) {
        node = node.from;
        node.isPath = true;
        pathQueue.unshift({node: node, type: "path"});
    }
    if (endNode.from) pathQueue.unshift({node: endNode, type: "path"});
    return pathQueue;
}

// clear button handler, clears everything
function Clear() {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    UpdateAnimationProgressBar();
    currAlgorithm = null;
    ClearAll();
    stateMachine.transition(APPSTATE.IDLE);
}

// reset button handler, clears everything except walls
function Reset() {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    UpdateAnimationProgressBar();
    currAlgorithm = null;
    ClearVisited();
    stateMachine.transition(APPSTATE.IDLE);
}

// remove walls
function ClearAll() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.setIsWall(false);
        node.visited = false;
        node.from = null;
        node.DOMNode.setVisited(false);
        node.DOMNode.setPath(false);
    }));
    hasVisitedNodes = false;
}

// clear visited state
function ClearVisited() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.visited = false;
        node.from = null;
        node.DOMNode.setVisited(false);
        node.DOMNode.setPath(false);
    }));
    hasVisitedNodes = false;
}

function UpdateAnimationProgressBar(value = null){
    if (animationProgress.max == 0) {
        animationProgress.style.background = `#fff`
    } else {
        if (value != null) animationProgress.value = value
        animationProgress.style.background = `linear-gradient(to right, #ff0000 0%, #ff0000 ${((animationProgress.value/animationProgress.max)*100).toFixed(2)}%, #fff ${((animationProgress.value/animationProgress.max)*100).toFixed(2)}%, white 100%)`
    }
}