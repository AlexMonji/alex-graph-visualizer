import DOMNode from "./CustomElements/DOMNode.js"
import DOMRow from "./CustomElements/DOMRow.js"

//Grid
//  generateGrid(nodeSize)
//  handleGridSize(nodeSize)
//  clearGrid()
//  handleGridSize(nodeSize)
class Grid {
    constructor(){
        this.grid = document.getElementById("grid");
        this.nodes = [];
        this.startNode = null;
        this.endNode = null;
        this.prevNode = null;
        this.nodeSizes = [40,24,12];
    }

    generateGrid(nodeSize) {
        // get grid dimensions
        const gridDimensions = this.grid.getBoundingClientRect();
        const gridWidth = gridDimensions.width;
        const gridHeight = gridDimensions.height;

        // clear children
        while (this.grid.firstChild) {
            this.grid.removeChild(grid.firstChild);
        }
        
        // generate nodes and DOM for nodes
        for (let row = 0; row < Math.floor(gridHeight/nodeSize); row++) {
            const newDOMRow = document.createElement("tr"); // DOM grid
            for (let col = 0; col < Math.floor(gridWidth/nodeSize); col++) {
                const newNode = new Node(row, col)

                // DOM Node setup
                const newDOMNode = new DOMNode(newNode);
                newDOMNode.addEventListener("mouseenter", (evt) => NodeMouseEnter(this, newNode, evt));
                newDOMNode.addEventListener("mousedown",  (evt) => NodeMouseDown(this, newNode, evt));
                newDOMNode.setAttribute('size', nodeSize);
                newDOMRow.appendChild(newDOMNode);

                // Internal Node
                newNode.DOMNode = newDOMNode;
                this.nodes.push(newNode);
            }
            this.grid.append(newDOMRow);
        }
    }

    // remove DOMNodes and clear state
    clearGrid() {
        this.nodes.forEach(node => node.clearAttributes());
        this.startNode = null;
        this.endNode = null;
        this.prevNode = null;
    }

    // generate new grid if grid size changes
    handleGridSize(nodeSize) { 
        this.generateGrid(this.nodeSizes[nodeSize]);
    }

    setStart(node) {
        if (this.startNode == node) {
            node.setIsStart(false);
            this.startNode = null;
        } else {
            if (this.startNode) this.startNode.setIsStart(false);
            node.setIsStart(true);
            this.startNode = node;
        }
    }

    setEnd(node) {
        if (this.endNode == node) {
            node.setIsEnd(false);
            this.endNode = null;
        } else {
            if (this.endNode) this.endNode.setIsEnd(false);
            node.setIsEnd(true);
            this.endNode = node;
        }
    }
}

//Node(row, col)
//  clearAttributes(node)
//  getNeighbors(node)
//  getDOMNode(node)
class Node {
    constructor(row, col) {
        this.id = `${row}_${col}`
        this.DOMNode = null;
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.isVisited = false;
    }

    getNeighbors(node) {
        const {row, col} = node;
        const neighbors = [];
        const colLength = nodes[0].length;
        const rowLength = nodes.length
        if (col+1 < colLength) {
            neighbors.push(nodes[row][col+1]);
        }
        if (row+1 < rowLength) {
            neighbors.push(nodes[row+1][col]);
        }
        if (col-1 > 0) {
            neighbors.push(nodes[row][col-1]);
        }
        if (row-1 > 0) {
            neighbors.push(nodes[row-1][col]);
        }
        return neighbors;
    }
    
    clearAttributes() {
        this.DOMNode.isStart = false;
        this.DOMNode.isEnd = false;
        this.DOMNode.isWall = false;
    }

    setIsVisited(value) {
        this.DOMNode.isVisited = value;
        this.isVisited = value;
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
}

class StateMachine {
    constructor (initialState) {
        this.state = initialState;
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

        this.state = APPSTATE[state.name];
        console.log(this.state);
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

// main
window.addEventListener("DOMContentLoaded", function() {

    const grid = new Grid();
    grid.generateGrid(24);

    // prevent contentmenu on node right click
    document.oncontextmenu = function(evt){
        if (evt.target instanceof DOMNode) {
            evt.preventDefault();
        }
    }

    // user actions
    const gridSize = document.getElementById("grid-size");
    gridSize.onchange = (evt) => grid.handleGridSize(evt.target.value);
    const clearButton = document.getElementById("clear-button");
    clearButton.onclick = (evt) => grid.clearGrid();

    const wallButton = document.getElementById("wall-button");
    wallButton.onclick = (evt) => handleAppState(APPSTATE.DRAW_WALL);
    const selectStartButton = document.getElementById("select-start-button");
    selectStartButton.onclick = (evt) => handleAppState(APPSTATE.SELECT_START);
    const selectEndButton = document.getElementById("select-end-button");
    selectEndButton.onclick = (evt) => handleAppState(APPSTATE.SELECT_END);
});

// Node Logic Handlers
function NodeMouseEnter(grid, node, evt) {
    stateMachine.handleMouseState(evt); // update mouse state before doing anything
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;
    
    // wall drawing
    if (stateMachine.state === APPSTATE.DRAW_WALL ) {
        if (leftMouseDown) node.setIsWall(true);
        if (rightMouseDown) node.setIsWall(false);
    }
}

function NodeMouseDown(grid, node, evt) {
    stateMachine.handleMouseState(evt);

    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;
    
    // wall drawing
    switch(stateMachine.state) {
        case APPSTATE.DRAW_WALL:
            if (leftMouseDown) node.setIsWall(true);
            if (rightMouseDown) node.setIsWall(false);
            break;
        case APPSTATE.SELECT_START:
            grid.setStart(node);
            break;
        case APPSTATE.SELECT_END:
            grid.setEnd(node);
            break;
        default:
            break;
    }
}

// global state
const APPSTATE = Object.freeze({
    IDLE: {
        name: "IDLE", 
        transitions: {
            DRAW_WALL: {name: "DRAW_WALL"},
            SELECT_START: {name: "SELECT_START"},
            SELECT_END: {name: "SELECT_END"},
        }
    },
    DRAW_WALL: {
        name: "DRAW_WALL",
        transitions: {
            IDLE: {name: "IDLE"},
            SELECT_START: {name: "SELECT_START"},
            SELECT_END: {name: "SELECT_END"},
        }
    },   
    SELECT_START: {
        name: "SELECT_START", 
        transitions: {
            IDLE: {name: "IDLE"},
            DRAW_WALL: {name: "DRAW_WALL"},
            SELECT_END: {name: "SELECT_END"},
        }
    }, 
    SELECT_END: {
        name: "SELECT_END", 
        transitions: {
            IDLE: {name: "IDLE"},
            DRAW_WALL: {name: "DRAW_WALL"},
            SELECT_START: {name: "SELECT_START"},
        }
    }, 
});

const stateMachine = new StateMachine(APPSTATE.IDLE);

// handle transitioning state machine based on user button press
function handleAppState(state) {
    switch(state) {
        // is user pressed wall button, set to draw wall mode
        case APPSTATE.DRAW_WALL:
            stateMachine.state !== APPSTATE.DRAW_WALL ? stateMachine.transition(APPSTATE.DRAW_WALL) : stateMachine.transition(APPSTATE.IDLE)
            break;
        // Place START
        case APPSTATE.SELECT_START:
            stateMachine.state !== APPSTATE.SELECT_START ? stateMachine.transition(APPSTATE.SELECT_START) : stateMachine.transition(APPSTATE.IDLE)
            break;
        // Place END
        case APPSTATE.SELECT_END:
            stateMachine.state !== APPSTATE.SELECT_END ? stateMachine.transition(APPSTATE.SELECT_END) : stateMachine.transition(APPSTATE.IDLE)
            break;
        default: 
            stateMachine.transition(APPSTATE.IDLE);
    }
    toggleButtons();
}

// toggle button appearance
function toggleButtons() {
    document.getElementById("wall-button").classList.remove("toggled");
    document.getElementById("select-start-button").classList.remove("toggled");
    document.getElementById("select-end-button").classList.remove("toggled");
    switch(stateMachine.state) {
        // is user pressed wall button, set to draw wall mode
        case APPSTATE.DRAW_WALL:
            document.getElementById("wall-button").classList.add("toggled");
            break;
        // Place START
        case APPSTATE.SELECT_START:
            document.getElementById("select-start-button").classList.add("toggled");
            break;
        // Place END
        case APPSTATE.SELECT_END:
            document.getElementById("select-end-button").classList.add("toggled");
            break;
        default: 
    }
}




