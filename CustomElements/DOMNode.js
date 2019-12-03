let nodeTemplate = document.createElement('template');

class DOMNode extends HTMLTableCellElement {
    constructor(node, nodeEventHandlers) {
        super();
        this.className = "node noDrag";
        this.row = node.row;
        this.col = node.col;
        this.node = node;
        this.direction = null;
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            default:
        }
    }

    set isWall(value) {
        const isWall = Boolean(value);
        if (isWall) {
            this.setAttribute('isWall', '');
            this.node.isWall = true;
        } else {
            this.removeAttribute('isWall');
            this.node.isWall = false;
        }
    }
      
    get isWall() {
        return this.node.isWall;
    }

    setVisited(value, direction) {
        const visited = Boolean(value);
        if (direction != "none" && direction != undefined && direction != null) { 
            this.direction = direction;
        }
        if (visited) {
            this.classList.add(`visited`);
            if (direction != "none") this.classList.add(`visited-${direction}`);
        } else {
            this.classList.remove(`visited`);
            this.classList.remove(`visited-${this.direction}`);
        }
    }

    setPath(value, direction) {
        const isPath = Boolean(value);
        if (isPath) {
            this.classList.add(`path`);
            if (direction != "none") this.classList.add(`path-${direction}`);
        } else {
            this.classList.remove(`path`);
            this.classList.remove(`path-${this.direction}`);
        }
    }

    set isStart(value) {
        const isStart = Boolean(value);
        if (isStart) {
            this.setAttribute('isStart', '');
        } else {
            this.removeAttribute('isStart');
        }
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
    }
      
    get isEnd() {
        return this.hasAttribute('isEnd');
    }

    set size(value) {
        const size = toString(value);
        if (size)
            this.setAttribute('size', size);
        else
            this.removeAttribute('size');
    }

    get size() {
        return this.getAttribute('size');
    }
}

customElements.define('dom-node', DOMNode, { extends: "td" });

export default DOMNode;