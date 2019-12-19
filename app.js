import Node from "./CustomElements/Node.js"
import AnimationControls from "./CustomElements/AnimationProgress.js"
import {BFS, DFS, Dijkstra, AStar} from "./algorithms.js"
import {DotProduct, Clamp, Fade} from "./util.js"

let animationQueue = [];
let animationControls = null;
let currAnimation = null;
let currAlgorithm = null;
let animationSpeed = 20;

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
                    currAnimation = setInterval(AnimateSearch, animationSpeed);
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
    if (currStartNode) currStartNode.isStart = false;
    newStartNode.isStart = true;
    return newStartNode;
}

function SetEndNode(newEndNode, currEndNode) {
    if (newEndNode == currEndNode) return currEndNode; // if already set, don't do anything
    if (currEndNode) currEndNode.isEnd = false;
    newEndNode.isEnd = true;
    return newEndNode;
}

function GenerateGrid() {
    // get grid dimensions
    const nodes = [];
    const grid = document.getElementById("grid");
    let {width, height} = grid.getBoundingClientRect();
    const nodeSize = 24;

    // make rows and cols odd in number
    const rows = Math.floor(height/nodeSize) % 2 ? Math.floor(height/nodeSize) : Math.floor(height/nodeSize)-1;
    const cols = Math.floor(width/nodeSize) % 2 ? Math.floor(width/nodeSize) : Math.floor(width/nodeSize)-1;

    // generate nodes
    for (let row = 0; row < rows; row++) {
        const nodeRow = [];
        const newDOMRow = document.createElement("tr"); // DOM grid
        for (let col = 0; col < cols; col++) {
            const newNode = new Node(row, col, nodes);

            // DOM Node setup
            newNode.addEventListener("mouseenter", (evt) => NodeMouseEnter(evt, newNode));
            newNode.addEventListener("mousedown",  (evt) => NodeMouseDown(evt, newNode));
            //newNode.setAttribute('size', nodeSize);
            newDOMRow.appendChild(newNode);

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

// main
window.addEventListener("DOMContentLoaded", function() {

    // if screen is thin, change shorten text in generate buttons
    if (window.innerWidth < 500) {
      document.querySelector("#maze summary").textContent = "Maze"
      document.querySelector("#weight summary").textContent = "Weights"
    }

    // create nodes and add them to the grid
    nodes = GenerateGrid();

    // prevent contentmenu on node right click
    document.oncontextmenu = function(evt){
        if (evt.target instanceof Node) {
            evt.preventDefault();
        }
    }

    // === user actions ===
    document.onmouseup = handleMouseUp;

    // animation progress bar
    animationControls = document.querySelector("animation-controls");
    animationControls.animationProgress.onchange = (evt) => { handleAnimationProgress(evt.target.value); }
    animationControls.animationProgress.oninput = (evt) => { evt.preventDefault(); } // override so correct value gets passed to handleAnimationProgress
    animationControls.playButton.onclick = () => handlePlay();

    // spacebar pauses and plays and decrements/increments animation progress when left and right arrow pressed
    document.onkeypress = (evt) => {
        if (evt.keyCode == 32 && !animationControls.disabled) handlePlay();
    }
    document.onkeydown = (evt) => {
        if (document.activeElement == animationControls.animationProgress) return;
        if (evt.keyCode == 37) handleAnimationProgress(parseInt(animationControls.value) - 1); // left arrow, decrement animation
        if (evt.keyCode == 39) handleAnimationProgress(parseInt(animationControls.value) + 1); // right arrow, increment animation 
    }

    // search algorithms
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

    // maze and weight generation
    const generateWeightSelect = document.querySelector("#weight .details-body");
    [...generateWeightSelect.childNodes].forEach(option => option.onclick = (evt) => GenerateWeight(evt.target.value));
    const generateMazeSelect = document.querySelector("#maze .details-body");
    [...generateMazeSelect.childNodes].forEach(option => option.onclick = (evt) => GenerateMaze(evt.target.value));
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
    animationControls.value = 0;
    stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
    if (currAnimation) clearInterval(currAnimation); // if going from pause to play causes an animation to start, cancel it and start a new one

    // run algorithm and then animate
    animationQueue = algorithm(startNode, endNode, nodes);
    animationQueue.shift(); // get rid of start node;
    const path = CreatePath(endNode);
    previousPath = path;
    animationQueue = animationQueue.concat(path); 
    animationControls.max = animationQueue.length;
    currAnimation = setInterval(AnimateSearch, animationSpeed);
    animationControls.animationProgress.focus();
}

// animate algorithm search
function AnimateSearch() {
    if (animationControls.value < animationQueue.length) {
        const { node, type } = animationQueue[animationControls.value++];
        type == "visit" ? node.setVisited(true) : node.setPath(true);
    } else {
        clearInterval(currAnimation);
        stateMachine.transition(APPSTATE.PAUSE);
    }
}


// when animation progress is handled by user
function handleAnimationProgress(value) {
    if (value < 0 || value > animationControls.max) return;
    stateMachine.transition(APPSTATE.PAUSE);
    console.log(animationControls.value, value)
    // if single stepping with arrow keys
    if (animationControls.value == value-1) {

        const {node, type} = animationQueue[animationControls.value];
        type == "visit" ? node.setVisited(true) : node.setPath(true);

    }
    else if (animationControls.value == value+1) {
        animationControls.value--;
        const {node, type} = animationQueue[animationControls.value];
        node.clearAnimate();
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

    animationControls.value = value;
    if (value == animationControls.max) {
        stateMachine.transition(APPSTATE.PAUSE);
    }
}


// when start or end node is updated, immediately show search result
function InstantAnimate() {
    if (!currAnimation || !currAlgorithm) return;
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
    animationControls.max = animationQueue.length;
    animationControls.value = animationQueue.length;
}

// play button handler, get rid of this eventually
function handlePlay() {
    // if at end of progress, restart if press play
    if (animationControls.value == animationControls.max) {
        animationControls.value = 0;
        ClearVisited();
        stateMachine.transition(APPSTATE.PLAYING_ANIMATION);
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
    currAlgorithm = null;
    animationControls.clear();
    ClearAll();
    stateMachine.transition(APPSTATE.IDLE);
}

// reset button handler, clears everything except walls
function Reset() {
    animationQueue = [];
    animationControls.clear();
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
        node.setVisited(false);
        node.setPath(false);
    }));
}

// clear visited state
function ClearVisited() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.visited = false;
        node.from = null;
        node.setVisited(false);
        node.setPath(false);
    }));
}

function TogglePlayButton(toggle) {
    switch(toggle) {
        case "play": 
            animationControls.playButton.className = "play";
            animationControls.disabled = false;
            break;
        case "pause": 
            animationControls.playButton.className = "pause";
            animationControls.disabled = false;
            break;
        case "disable":
            animationControls.disabled = true;
    } 
}

function GenerateWeight(weightAlgorithm) {
    const algorithms = {
        random: GenerateRandomWeight,
        perlin: GeneratePerlinNoiseWeight,
    }

    // clear weights
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.classList.remove(`cost-${node.cost}`);
        node.cost = 1;
        node.removeAttribute("weighted");
    }))


    if(weightAlgorithm != "clear") algorithms[weightAlgorithm](); // run algorithm
    stateMachine.transition(APPSTATE.PAUSE);
    InstantAnimate(); // finish animation
}

function GenerateRandomWeight() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.cost = parseInt(Math.random()*10);
        node.classList.add(`cost-${node.cost}`);
        node.setAttribute("weighted", "weighted");
    }))
}

function GeneratePerlinNoiseWeight() {
    const gradientVectors = [[1,1],[1.4,0],[-1,1],[0,1.4],[1,-1],[-1.4,0],[-1,-1],[0,-1.4]];
    const rows = nodes.length;
    const cols = nodes[0].length;
    const numberTablesRow = Math.max(1, Math.floor(Math.random()*3+2)); // vary number of mini grids
    const numberTablesCol = Math.max(1, Math.floor(numberTablesRow*cols/rows)); // try to keep mini grids square by adjusting for ratio of cols to rows
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
                    nodes[actualRow][actualCol].classList.add(`cost-${nodeCost}`);
                    nodes[actualRow][actualCol].setAttribute("weighted", "weighted");
                }
            }   
        }
    }
}

function GenerateMaze(mazeAlgorithm) {
    const algorithms = {
        random: GenerateRandomMaze,
        prim: GeneratePrimMaze,
        sparse: () => GenerateSparseMaze(2),
        very_sparse: () => GenerateSparseMaze(1)
    }
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.setIsWall(false);
        node.visited = false;
        node.from = null;
        node.setVisited(false);
        node.setPath(false);
    }));

    if (mazeAlgorithm != "clear") algorithms[mazeAlgorithm]();
    InstantAnimate();
    if (currAnimation) {
        stateMachine.transition(APPSTATE.PAUSE);
    } else {
        stateMachine.transition(APPSTATE.IDLE);
    }
}

// reference https://stackoverflow.com/questions/29739751/implementing-a-randomly-generated-maze-using-prims-algorithm
function GeneratePrimMaze(mazeAlgorithm) {
    // all nodes begin exist in 1 of 2 states, blocked or passage, all begin as blocked except for start
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        node.state = "blocked";
    }))
    startNode.state = "passage";
    startNode.visited = true;
    let frontierNodes = startNode.getFrontierNeighbors("blocked"); // get all blocked nodes at distance 2 from start

    while (frontierNodes.length > 0) {
        const frontierNodeIndex = Math.floor(Math.random()*frontierNodes.length)
        const frontierNode = frontierNodes[frontierNodeIndex]; // pick random frontier node from list of frontier nodes

        const neighbors = frontierNode.getFrontierNeighbors("passage"); // get all nodes at distance 2 in state passage
        const neighbor = neighbors[Math.floor(Math.random()*neighbors.length)]; // pick one at random to connect with

        let connectorNode = null;
        const connectorRow = frontierNode.row+((neighbor.row-frontierNode.row)/2);
        const connectorCol = frontierNode.col+((neighbor.col-frontierNode.col)/2);

        // if connector node is within the grid, go ahead and get it and set it to passage, otherwise just continue
        if (connectorRow >= 0 && connectorCol >= 0 && connectorRow < nodes.length && connectorCol < nodes[0].length) {
            connectorNode = nodes[connectorRow][connectorCol]; // get node inbetween and set to passage
        } else {
            frontierNodes.splice(frontierNodeIndex, 1); // remove the frontier node we marked as passage from list
            continue;
        }

        if (connectorNode) connectorNode.state = "passage";
        frontierNode.state = "passage";
    
        frontierNodes.splice(frontierNodeIndex, 1); // remove the frontier node we marked as passage from list
         // append all blocked nodes (that haven't been seen before)  at distance 2 from the frontier node
         // if the frontier node was a fake, then don't try to continue beyond the grid by adding more fake frontier nodes
        if (!frontierNode.isFake) {
            frontierNode.getFrontierNeighbors("blocked").forEach(node => {
                if (!node.visited) { 
                    frontierNodes.push(node); 
                    node.visited = true;
                }
            });
        }
    }

    // actually set the walls
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.state == "blocked") node.setIsWall(true);
    }))
    endNode.setIsWall(false);
}

// same as above, but ignores if frontier node has already been visited and runs twice to get some interesting walls and pits
function GenerateSparseMaze(runs) {
    for (let x = 0; x < runs; x++) {
        nodes.forEach(nodeRow => nodeRow.forEach(node => {
            node.state = "blocked";
        }))

        startNode.state = "passage";
        startNode.visited = true;
        let frontierNodes = startNode.getFrontierNeighbors("blocked"); // get all blocked nodes at distance 2 from start

        while (frontierNodes.length > 0) {
            const frontierNodeIndex = Math.floor(Math.random()*frontierNodes.length)
            const frontierNode = frontierNodes[frontierNodeIndex]; // pick random frontier node from list of frontier nodes
    
            const neighbors = frontierNode.getFrontierNeighbors("passage"); // get all nodes at distance 2 in state passage
            const neighbor = neighbors[Math.floor(Math.random()*neighbors.length)]; // pick one at random to connect with
    
            let connectorNode = null;
            const connectorRow = frontierNode.row+((neighbor.row-frontierNode.row)/2);
            const connectorCol = frontierNode.col+((neighbor.col-frontierNode.col)/2);
    
            // if connector node is within the grid, go ahead and get it and set it to passage, otherwise just continue
            if (connectorRow >= 0 && connectorCol >= 0 && connectorRow < nodes.length && connectorCol < nodes[0].length) {
                connectorNode = nodes[connectorRow][connectorCol]; // get node inbetween and set to passage
            } else {
                frontierNodes.splice(frontierNodeIndex, 1); // remove the frontier node we marked as passage from list
                continue;
            }
    
            if (connectorNode) connectorNode.state = "passage";
            frontierNode.state = "passage";
        
            frontierNodes.splice(frontierNodeIndex, 1); // remove the frontier node we marked as passage from list
             // append all blocked nodes (that haven't been seen before)  at distance 2 from the frontier node
             // if the frontier node was a fake, then don't try to continue beyond the grid by adding more fake frontier nodes
            if (!frontierNode.isFake) {
                frontierNode.getFrontierNeighbors("blocked").forEach(node => {
                        frontierNodes.push(node); 
                        node.visited = true;
                });
            }
        }

        // set walls
        nodes.forEach(nodeRow => nodeRow.forEach(node => {
            if (node.state == "blocked") node.setIsWall(true);
        }))
    }

    // get rid of islands
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.isWall) {
            let island = true;
            node.getNeighbors().forEach(({neighbor, type}) => {
                if (neighbor.isWall) {
                    island = false;
                }
            })
            if (island) { 
                node.setIsWall(false);
            }
        }
    }))

    endNode.setIsWall(false);
}

function GenerateRandomMaze() {
    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node != startNode && node != endNode) {
            if (Math.random() > .7) {
                node.setIsWall(true)      
            }
        }
    })) 
}