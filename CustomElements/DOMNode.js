let nodeTemplate = document.createElement('template');

class DOMNode extends HTMLDivElement {
    constructor(node, mouseState, appState, nodeEventHandlers) {
        super();
        this.mouseState = mouseState;
        this.className = "node noDrag";
        this.row = node.row;
        this.col = node.col;
        this.node = node;
        this.addEventListener("mouseenter", (evt) => nodeEventHandlers.MouseEnter(this, evt));
        this.addEventListener("mousedown",  (evt) => nodeEventHandlers.MouseDown(this, evt));
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
        if (isWall)
            this.setAttribute('isWall', '');
        else
            this.removeAttribute('isWall');
    }
      
    get isWall() {
        return this.hasAttribute('isWall');
    }

    set isVisited(value) {
        const isVisited = Boolean(value);
        if (isVisited)
            this.setAttribute('isVisited', '');
        else
            this.removeAttribute('isVisited');
    }
      
    get isVisited() {
        return this.hasAttribute('isVisited');
    }

    set isStart(value) {
        const isStart = Boolean(value);
        if (isStart)
            this.setAttribute('isStart', '');
        else
            this.removeAttribute('isStart');
    }
      
    get isStart() {
        return this.hasAttribute('isStart');
    }

    set isEnd(value) {
        const isEnd = Boolean(value);
        if (isEnd)
            this.setAttribute('isEnd', '');
        else
            this.removeAttribute('isEnd');
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

customElements.define('dom-node', DOMNode, { extends: "div" });

export default DOMNode;