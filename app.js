import DOMNode from "./CustomElements/DOMNode.js"
import DOMRow from "./CustomElements/DOMRow.js"
import {BFS, DFS, Dijkstra, AStar} from "./algorithms.js"
import {DotProduct, Clamp, Fade} from "./util.js"

let animationQueue = [];
let animationProgress = null;
let animationIndex = 0;
let currAnimation = null;
let currAlgorithm = null;

let animationCounter = null;
let animationCounterMax = null;

// nodes
let nodes = [];
let startNode = null;
let endNode = null;

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
        let nextState = APPSTATE[state.name]
        let nextStateTransition = this.state.transitions[state.name];

        // if next state doesn't exist, show default error and don't transition
        if (!nextStateTransition) {
            alert(`No transition ${this.state.name} => ${state.name}`);
            return;
        }
        // if next state has an error, call its error function and don't transition
        if (nextStateTransition.error) { 
            nextStateTransition.error();
            return
        }
        
        if (this.state.prepareForExitAll) this.state.prepareForExit.prepareForExitAll();
        if (nextState.prepareForEnterAll) nextState.prepareForEnterAll();
        if (nextStateTransition.animation) nextState.animation();
        if (nextStateTransition.prepareForEnter) nextStateTransition.prepareForEnter();

        
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
        prepareForEnterAll: () => {
            TogglePlayButton("disable");
        },
        transitions: {
            IDLE: {name: "IDLE"},
            MOVE_START: {name: "MOVE_START"},
            MOVE_END: {name: "MOVE_END"},
            PLAYING_ANIMATION: {name: "PLAYING_ANIMATION"},
            PAUSE: {name: "PAUSE"}
        },
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
        prepareForEnterAll: () => {
            TogglePlayButton("pause");
        }, 
        transitions: {
            PLAYING_ANIMATION: {
                name: "PLAYING_ANIMATION",
                prepareForEnter: () => {
                    clearInterval(currAnimation);
                }
            },
            PAUSE: {
                name: "PAUSE",
                prepareForEnter: () => {
                    clearInterval(currAnimation);
                }
            },
            IDLE: {
                name: "IDLE",
                prepareForEnter: () => {
                    clearInterval(currAnimation);
                    currAnimation = null;
                }
            },
            MOVE_END: {
                name: "MOVE_END",
                prepareForEnter: () => {
                    clearInterval(currAnimation);
                }
            },
            MOVE_START: {
                name: "MOVE_START",
                prepareForEnter: () => {
                    clearInterval(currAnimation);
                }
            }
        }
    }, 
    PAUSE: {
        name: "PAUSE", 
        prepareForEnterAll: () => {
            TogglePlayButton("play");
        },
        transitions: {
            PLAYING_ANIMATION: {
                name: "PLAYING_ANIMATION",
                prepareForEnter: () => {
                    currAnimation = setInterval(AnimateSearch, 5);
                }
            },
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
        this.cost = 1; // default one, unweighted
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
            if (!neighbor.visited && !neighbor.isWall) {
                neighbor.from = this;
                neighbor.direction = "left";
                neighbors.push( neighbor );
            }
        }
        if (row+1 < rowLength) {
            neighbor = nodes[row+1][col];
            if (!neighbor.visited && !neighbor.isWall) {
                neighbor.from = this;
                neighbor.direction = "above";
                neighbors.push( neighbor );
            }
        }
        if (col-1 >= 0) {
            neighbor = nodes[row][col-1];
            if (!neighbor.visited && !neighbor.isWall) {
                neighbor.from = this;
                neighbor.direction = "right";
                neighbors.push( neighbor );
            }
        }
        if (row-1 >= 0) {
            neighbor = nodes[row-1][col];
            if (!neighbor.visited && !neighbor.isWall) {
                neighbor.from = this;
                neighbor.direction = "below";
                neighbors.push( neighbor );
            }
        }
        return neighbors;
    }

    getAllNeighbors() {
        const {row, col} = this;
        const neighbors = [];
        const colLength = nodes[0].length;
        const rowLength = nodes.length
        let neighbor = null;
        if (col+1 < colLength) {
            neighbor = nodes[row][col+1];
            if (!neighbor.isWall) {
                neighbors.push( {neighbor, direction: "left"} );
            }
        }
        if (row+1 < rowLength) {
            neighbor = nodes[row+1][col];
            if (!neighbor.isWall) {
                neighbors.push( {neighbor, direction: "above"} );
            }
        }
        if (col-1 >= 0) {
            neighbor = nodes[row][col-1];
            if (!neighbor.isWall) {
                neighbors.push( {neighbor, direction: "right"} );
            }
        }
        if (row-1 >= 0) {
            neighbor = nodes[row-1][col];
            if (!neighbor.isWall) {
                neighbors.push( {neighbor, direction: "below"} );
            }
        }
        return neighbors;
    }

    setVisited(value, animate = true) {
        this.DOMNode.setVisited(value, this.direction, animate);
    }

    setPath(value, animate = true) {
        this.DOMNode.setPath(value, animate);     
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
    const DijkstraButton = document.getElementById("algorithm-Dijkstra");
    DijkstraButton.onclick = () => RunAlgorithm(Dijkstra);
    const AStarButton = document.getElementById("algorithm-A*");
    AStarButton.onclick = () => RunAlgorithm(AStar);
    const clearButton = document.getElementById("clear-button");
    clearButton.onclick = () => Clear(grid);
    const resetButton = document.getElementById("reset-button");
    resetButton.onclick = () => Reset(grid);
    animationCounter = document.getElementById("animation-index");
    animationCounterMax = document.getElementById("animation-index-max");

    const generateNoiseSelect = document.getElementById("details-body");
    [...generateNoiseSelect.childNodes].forEach(option => option.onclick = (evt) => GenerateNoise(evt.target.value));
});

// Node Logic Handlers
function NodeMouseEnter(event, node) {
    stateMachine.handleMouseState(event); // update mouse state before doing anything
    const leftMouseDown = stateMachine.mouseState.leftMouseDown;
    const rightMouseDown = stateMachine.mouseState.rightMouseDown;
    
    // wall drawing
    switch(stateMachine.state) {
        case APPSTATE.PAUSE:
            if (leftMouseDown && node != startNode && node != endNode) node.setIsWall(true);
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
    if (currAnimation) clearInterval(currAnimation); // if going from pause to play causes an animation to start, cancel it and start a new one

    // run algorithm and then animate
    animationQueue = algorithm(startNode, endNode, nodes);
    animationQueue.shift(); // get rid of start node;
    const path = CreatePath(endNode)
    previousPath = path;
    animationQueue = animationQueue.concat(path); 
    animationProgress.max = animationQueue.length;
    currAnimation = setInterval(AnimateSearch, 5);
    animationProgress.focus();
}

// animate algorithm search
function AnimateSearch() {
    if (animationIndex < animationQueue.length) {
        animationProgress.value++;
        const { node, type } = animationQueue[animationIndex++];
        type == "visit" ? node.setVisited(true) : node.setPath(true);
        UpdateAnimationProgressBar();
    } else {
        clearInterval(currAnimation);
        stateMachine.transition(APPSTATE.PAUSE);
    }
}


// when animation progress is handled by user
function handleAnimationProgress(value) {
    animationProgress.value = value;
    UpdateAnimationProgressBar();
    
    stateMachine.transition(APPSTATE.PAUSE);

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
            if (type == "visit") {
                node.clearAnimate();
                node.setVisited(false, false);
            } else {
                node.clearAnimate();
                node.setPath(false, false);
            }
        }
    }
    animationIndex = value;

    if (value == animationProgress.max) {
        stateMachine.transition(APPSTATE.PAUSE);
    }
}


// when start or end node is updated, immediately show search result
function InstantAnimate() {
    if (!currAnimation) return;
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
    animationQueue = currAlgorithm(startNode, endNode, nodes);
    animationQueue.shift(); // remove start node from animation
    previousPath = CreatePath(endNode);
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.visited) {
            node.clearAnimate();
            node.setVisited(true, false)
        } else {
            node.setVisited(false, false);
        }
        if (node.isPath && node != startNode) {
            node.setPath(true, false);
        }
    }))
    animationQueue = animationQueue.concat(previousPath); 
    animationProgress.max = animationQueue.length;
    animationProgress.value = animationQueue.length;
    UpdateAnimationProgressBar();

}

// play button handler, get rid of this eventually
function handlePlay() {
    // if at end of progress, restart if press play
    if (animationProgress.value == animationProgress.max) {
        animationIndex = 0;
        animationProgress.value = 0;
        ClearVisited();
        stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
        UpdateAnimationProgressBar();
        return;
    }
    if (stateMachine.state == APPSTATE.PLAYING_ANIMATION) {
        stateMachine.transition(APPSTATE.PAUSE);
    } else if (stateMachine.state == APPSTATE.PAUSE) {
        stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
    }
}

// figure out the path
function CreatePath(endNode) {
    let node = endNode;
    let pathQueue = [];
    let costOfPath = 0;
    while (node.from) {
        node = node.from;
        node.isPath = true;
        if (node != startNode) { 
            pathQueue.push({node: node, type: "path"});
            costOfPath += node.cost;
        }
    }
    document.getElementById("cost-of-path").textContent = costOfPath;
    return pathQueue.reverse();;
}

// clear button handler, clears everything
function Clear() {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    currAlgorithm = null;
    ClearAll();
    UpdateAnimationProgressBar();
    stateMachine.transition(APPSTATE.IDLE);
}

// reset button handler, clears everything except walls
function Reset() {
    animationQueue = [];
    animationIndex = 0;
    animationProgress.value = 0;
    animationProgress.max = 0;
    currAlgorithm = null;
    ClearVisited();
    UpdateAnimationProgressBar();
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
}

// clear visited state
function ClearVisited() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.visited = false;
        node.from = null;
        node.DOMNode.setVisited(false);
        node.DOMNode.setPath(false);
    }));
}

function UpdateAnimationProgressBar(value = null){
    if (animationProgress.max == 0) {
        animationProgress.style.background = `#fff`
    } else {
        if (value != null) animationProgress.value = value
        animationProgress.style.background = `linear-gradient(to right, #ff0000 0%, #ff0000 ${((animationProgress.value/animationProgress.max)*100).toFixed(2)}%, #fff ${((animationProgress.value/animationProgress.max)*100).toFixed(2)}%, white 100%)`
    }
    animationCounter.textContent = animationProgress.value;
    animationCounterMax.textContent = animationProgress.max;
}

function TogglePlayButton(toggle) {
    const playButton = document.getElementById("play-button");
    switch(toggle) {
        case "play": 
            playButton.className = "play";
            playButton.disabled = false;
            animationProgress.disabled = false;
            break;
        case "pause": 
            playButton.className = "pause";
            playButton.disabled = false;
            animationProgress.disabled = false;
            break;
        case "disable":
            animationProgress.disabled = true;
            playButton.disabled = true;
    } 
}

function GenerateNoise(noiseAlgorithm) {
    const algorithms = {
        random: GenerateRandomNoise,
        perlin: GeneratePerlinNoise,
    }

    // clear weights
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.DOMNode.classList.remove(`cost-${node.cost}`);
        node.cost = 1;
        node.DOMNode.removeAttribute("weighted");
    }))

    if(noiseAlgorithm == "clear") return;
    algorithms[noiseAlgorithm](); // run algorithm
    stateMachine.transition(APPSTATE.PAUSE);
    InstantAnimate(); // finish animation
}

function GenerateRandomNoise() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.cost = parseInt(Math.random()*10);
        node.DOMNode.classList.add(`cost-${node.cost}`);
        node.DOMNode.setAttribute("weighted", "weighted");
    }))
}

function GeneratePerlinNoise() {
    const gradientVectors = [[1,1],[1.4,0],[-1,1],[0,1.4],[1,-1],[-1.4,0],[-1,-1],[0,-1.4]];
    const rows = nodes.length;
    const cols = nodes[0].length;
    const numberTablesRow = Math.floor(Math.random()*3+2); // vary number of mini grids
    const numberTablesCol = Math.floor(numberTablesRow*1.4);
    const tableRows = parseInt(rows/numberTablesRow)+1; // rows per mini grid
    const tableCols = parseInt(cols/numberTablesCol)+1; // cols per mini grid
    // split grid into numberTablesRow * numberTablesCol many smaller grids
    // generate gradient vectors
    let tableGradientVectors = [];
    for(let x = 0; x < numberTablesRow + 1; x++) {
        const tableGradientVectorsRow = [];
        for(let y = 0; y < numberTablesCol + 1; y++) {
            tableGradientVectorsRow.push(gradientVectors[Math.floor(Math.random() * gradientVectors.length)]);
        }
        tableGradientVectors.push(tableGradientVectorsRow)
    }
    for (let gr = 0; gr < numberTablesRow; gr++) {
        for (let gc = 0; gc < numberTablesCol; gc++) {
            const gridGradientVectorTopLeft = tableGradientVectors[gr][gc];
            const gridGradientVectorTopRight = tableGradientVectors[gr][gc+1];
            const gridGradientVectorBottomRight = tableGradientVectors[gr+1][gc+1];
            const gridGradientVectorBottomLeft = tableGradientVectors[gr+1][gc];
            // for each cell inside the smaller grid
            for (let r = 0; r < tableRows; r++) {
                const actualRow = gr*tableRows+r;
                for (let c = 0; c < tableCols; c++) {
                    const actualCol = gc*tableCols+c;
                    if (actualCol >= cols || actualRow >= rows) continue;
                    const localXOffset = Fade(c/(tableCols-1));
                    const localYOffset = Fade(r/(tableRows-1));
                    const distanceVectorTopLeft = [localXOffset, 1-localYOffset];
                    const distanceVectorTopRight = [localXOffset-1, 1-localYOffset];
                    const distanceVectorBottomRight = [localXOffset-1, localYOffset];
                    const distanceVectorBottomLeft = [localXOffset, localYOffset];
                    const dotA = DotProduct(gridGradientVectorTopLeft,distanceVectorTopLeft); // dotProd from top left
                    const dotB = DotProduct(gridGradientVectorTopRight,distanceVectorTopRight); // dotProd from top right
                    const dotC = DotProduct(gridGradientVectorBottomLeft,distanceVectorBottomLeft); 
                    const dotD = DotProduct(gridGradientVectorBottomRight,distanceVectorBottomRight);
                    const AB = dotA + localXOffset * (dotB - dotA); // interpolate between top left and top right
                    const CD = dotC + localXOffset * (dotD - dotC); // interpolate between bottom left and bottom right
                    const value = AB + localYOffset * (CD - AB);
                    const nodeCost = Math.floor(Clamp(value*5+5,1, 10.99));
                    nodes[actualRow][actualCol].cost = nodeCost;
                    nodes[actualRow][actualCol].DOMNode.classList.add(`cost-${nodeCost}`);
                    nodes[actualRow][actualCol].DOMNode.setAttribute("weighted", "weighted");
                }
            }   
        }
    }
}

