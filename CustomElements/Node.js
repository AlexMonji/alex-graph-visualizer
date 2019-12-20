class Node extends HTMLTableCellElement {
    constructor(row, col, nodes) {
        super();
        this.className = "node noDrag";
        this.id = `${row}_${col}`
        this.nodes = nodes;
        this.row = row;
        this.col = col;
        
        this.isWall = false;

        this.visited = false;
        this.from = null; // the neighbor that visited this node 
        this._direction = null;
 
        this.state = null;
        this.weight = 1; // default one, unweighted
    }

    setVisited(value, animate) {
        const visited = Boolean(value);

        if (visited) {
            this.classList.add(`visited`);
            if (this._direction) this.classList.add(`${this._direction}`);
            if (animate) this.classList.add("animate");
        } 
        // reset styling
        else {
            this.classList.remove(`visited`);
            this.classList.remove(`${this._direction}`);
        }
    }

    setWall(value) {
        this.isWall = value;
    }

    setPath(value, animate) {
        const isPath = Boolean(value);
        if (isPath) {
            if (animate) this.classList.add("animate")
            this.classList.add(`path`);
        } else {
            this.classList.remove(`path`);
        }
    }

    clearAnimate() {
        this.classList.remove(`animate`);
    }

    getNeighbors() {
        const {row, col} = this;
        const neighbors = [];
        const colLength = this.nodes[0].length;
        const rowLength = this.nodes.length
        let neighbor = null;
        if (col+1 < colLength) {
            neighbor = this.nodes[row][col+1];
            neighbors.push( {neighbor, direction: "left"} );
        }
        if (row+1 < rowLength) {
            neighbor = this.nodes[row+1][col];
            neighbors.push( {neighbor, direction: "above"} );
        }
        if (col-1 >= 0) {
            neighbor = this.nodes[row][col-1];
            neighbors.push( {neighbor, direction: "right"} );
        }
        if (row-1 >= 0) {
            neighbor = this.nodes[row-1][col];
            neighbors.push( {neighbor, direction: "below"} );
        }
        return neighbors;
    }

    getFrontierNeighbors(state) {
        // get all frontier neighbors, nodes that are 2 or less moves from the source node
        const frontierNeighbors = [];
        for(let row = -2; row < 3; row++) {
            for(let col = -2; col < 3; col++) {
                const rowAbs = Math.abs(row);
                const colAbs = Math.abs(col);

                if (!(rowAbs == 0 && colAbs == 2) && !(rowAbs == 2 && colAbs == 0)) continue;
                const actualRow = this.row+row;
                const actualCol = this.col+col;
                if ((actualRow >= 0 && actualRow < this.nodes.length) && (actualCol >= 0 && actualCol < this.nodes[0].length)) {

                    const node = this.nodes[actualRow][actualCol];
                    if (node.state == state) {
                        frontierNeighbors.push(node);
                    }
                } else if (state == "blocked") {
                    const fakeNode = new Node(actualRow, actualCol, this.nodes);   
                    fakeNode.state = "blocked";
                    fakeNode.isFake = true;
                    if (fakeNode.state == state) {
                        frontierNeighbors.push(fakeNode);
                    }
                }
            }
        }
        return frontierNeighbors;
    }

    set isStart(value) {
        const isStart = Boolean(value);
        if (isStart) {
            this.setAttribute('isStart', '');
        } else {
            this.removeAttribute('isStart');
        }
        this.updateTitle();
    }
      
    get isStart() {
        return this.hasAttribute('isStart');
    }

    set isEnd(value) {
        const isEnd = Boolean(value);
        if (isEnd) {
            this.setAttribute('isEnd', '');
        } else {
            this.removeAttribute('isEnd');
        }    
        this.updateTitle();
    }
      
    get isEnd() {
        return this.hasAttribute('isEnd');
    }

    set direction(value) {
        this.classList.remove(`${this.direction}`)
        this._direction = value;
    }

    get direction() {
        return this._direction;
    }

    set isWall(value) {
        const isWall = Boolean(value);
        if (isWall) {
            this.setAttribute('isWall', '');
        } else {
            this.removeAttribute('isWall');
        }
        this.updateTitle();
    }
      
    get isWall() {
        return this.hasAttribute("isWall");
    }

    set weight(value) {
        this._weight = value;
        this.cost = parseInt(value);
        this.updateTitle();
    }

    get weight() {
        return this._weight;
    }

    updateTitle() {
        if (this.hasAttribute('isStart')) {
            this.title = "Start Node" 
        } else if (this.hasAttribute('isEnd')) {
            this.title = "End Node"
        } else if (this.hasAttribute('isWall')) {
            this.title = "Wall"
        } else {
            this.title = `Weight ${this.weight}`
        }
    }
}

customElements.define('dom-node', Node, { extends: "td" });

export default Node;