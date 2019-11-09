import DOMNode from "./CustomElements/DOMNode.js"
import DOMRow from "./CustomElements/DOMRow.js"





//Node(row, col)
//  clearAttributes(node)
//  getNeighbors(node)
//  getDOMNode(node)

//generateGrid(nodeSize)
//handleGridSize(nodeSize)
//clearGrid

//handleMouseState(evt)
//handleAppState(evt, state)

// state
const APPSTATE = Object.freeze({DRAW_WALL: "DRAW_WALL", IDLE: "IDLE", SELECT_START: "SELECT_START", SELECT_END: "SELECT_END"})
const nodes = [];
const DOMNodes = [];
let startNode = null;
let endNode = null;
let prevNode = null;

const mouseState = {mouseDown: false}
const appState = {state: APPSTATE.IDLE}

// node data template and manipulation
class Node {
    constructor(row, col) {
        this.id = `${row}_${col}`
        this.DOMNode = null;
        this.row = row;
        this.col = col;
        this.isWall = false;
        this.isVisited = false;
    }

    static getNeighbors(node) {
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
    
    static clearAttributes(node) {
        const DOMNode = Node.getDOMNode(node);
        DOMNode.removeAttribute('isStart');
        DOMNode.removeAttribute('isEnd');
        DOMNode.removeAttribute('isWall');
    }
    
    static getDOMNode(node) {
        const {row, col} = node;
        return document.getElementById(`${row}_${col}`)
    }

    static setWall(DOMNode) {
        const node = DOMNode.node;
        const isWall = node.isWall;
        if (isWall) {
            DOMNode.removeAttribute('isWall');
            node.isWall = false;
        } else { 
            DOMNode.setAttribute('isWall', true);
            node.isWall = true;
        }
    }
    
}

// event handlers for DOM Nodes
const nodeEventHandlers = {
    // ENTER
    MouseEnter: function(DOMNode, evt) {
        handleMouseState(evt);
        // wall drawing
        if (appState.state === APPSTATE.DRAW_WALL && mouseState.mouseDown) {
            Node.setWall(DOMNode)
        }
    },
    // DOWN
    MouseDown: function(DOMNode, evt) {
        handleMouseState(evt);
        // wall drawing
        if (appState.state === APPSTATE.DRAW_WALL && mouseState.mouseDown) {
            Node.setWall(DOMNode);
        }

        // select start
        if (appState.state === APPSTATE.SELECT_START && mouseState.mouseDown) {
            const isStart = DOMNode.isStart;
            if (isStart) {
                DOMNode.removeAttribute('isStart');
                startNode = null;
            } else {
                DOMNode.setAttribute('isStart', true);
                startNode = DOMNOde.node;
                if (prevNode) prevNode.removeAttribute('isStart');
                prevNode = Node.getDOMNode(startNode);
                console.log(prevNode)
            }
            console.log("MOUSEDOWN: ", evt);
        }

         // select end
         if (appState.state === APPSTATE.SELECT_END && mouseState.mouseDown) {
            const isEnd = DOMNode.isEnd;
            if (isEnd) {
                DOMNode.removeAttribute('isEnd');
                endNode = null;
            } else {
                DOMNode.setAttribute('isEnd', true);
                endNode = DOMNode.node;
                if (prevNode) prevNode.removeAttribute('isEnd');
                prevNode = Node.getDOMNode(endNode);
            }
            console.log("MOUSEDOWN: ", evt);
        }
    }
}

// DOM grid
const grid = document.getElementById("grid");
const gridDimensions = grid.getBoundingClientRect();
const gridWidth = gridDimensions.width;
const gridHeight = gridDimensions.height;
window.onload = () => {
    generateGrid(24);
};

function generateGrid(nodeSize) {
    // clear children
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    
    // generate nodes and DOM for nodes
    for (let row = 0; row < Math.floor(gridHeight/nodeSize); row++) {
        const newDOMRow = new DOMRow(); // DOM grid
        const nodeRow = [];
        for (let col = 0; col < Math.floor(gridWidth/nodeSize); col++) {
            const newNode = new Node(row, col)
            const newDOMNode = new DOMNode(newNode, mouseState, appState, nodeEventHandlers);
            newNode.DOMNode = newDOMNode;
            newDOMNode.id = `${row}_${col}`;
            newDOMNode.setAttribute('size', nodeSize);
            newDOMRow.appendChild(newDOMNode); // DOM node
            DOMNodes.push(newDOMNode);
            nodeRow.push(newNode); // node
        }
        grid.append(newDOMRow); // DOM grid
        nodes.push(nodeRow); //grid
    }
}

// setup mouse handlers 
document.onmousedown = handleMouseState;
document.onmouseup = handleMouseState;

// user actions
const wallButton = document.getElementById("wall-button");
wallButton.onclick = (evt) => handleAppState(evt, APPSTATE.DRAW_WALL);
const gridSize = document.getElementById("grid-size");
gridSize.onchange = (evt) => handleGridSize(evt.target.value);
const clearButton = document.getElementById("clear-button");
clearButton.onclick = (evt) => clearGrid();
const selectStartButton = document.getElementById("select-start-button");
selectStartButton.onclick = (evt) => handleAppState(evt, APPSTATE.SELECT_START);
const selectEndButton = document.getElementById("select-end-button");
selectEndButton.onclick = (evt) => handleAppState(evt, APPSTATE.SELECT_END);

function handleGridSize(nodeSize) {
    const nodeSizes = [40,24,12];
    generateGrid(nodeSizes[nodeSize]);
}

function clearGrid() {
    // clear grid
    DOMNodes.forEach(node => Node.clearAttributes(node));
    // reset state
    startNode = null;
    endNode = null;
    prevNode = null;
}

function handleMouseState(evt) {
    switch (evt.type) {
        case "mousedown":
        case "mouseenter":
        case "mouseup":
            mouseState.mouseDown = evt.buttons === undefined ? evt.which === 1 : evt.buttons === 1; // true if left mouse down, false otherwise
            break;
        default:
            console.log(evt.type)
    }
}

function handleAppState(evt, state) {
    switch(state) {
        // is user pressed wall button, set to draw wall mode
        case APPSTATE.DRAW_WALL:
            if (appState.state !== APPSTATE.DRAW_WALL) {
                console.log("DRAWING WALLS")
                appState.state = APPSTATE.DRAW_WALL;
            } else {
                appState.state = APPSTATE.IDLE;
            }
            break;
        // Place START
        case APPSTATE.SELECT_START:
            if (appState.state !== APPSTATE.SELECT_START) {
                console.log("SELECTING START")
                appState.state = APPSTATE.SELECT_START;
            } else {
                appState.state = APPSTATE.IDLE;
            }
            break;
        // Place EMD
        case APPSTATE.SELECT_END:
            if (appState.state !== APPSTATE.SELECT_END) {
                console.log("SELECTING END")
                appState.state = APPSTATE.SELECT_END;
            } else {
                appState.state = APPSTATE.IDLE;
            }
            break;
        default: 
            appState.state = APPSTATE.IDLE;
    }
}




