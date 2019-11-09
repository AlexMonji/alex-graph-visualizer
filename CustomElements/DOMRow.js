class DOMRow extends HTMLDivElement {
    constructor(mouseState) {
        super();
        this.mouseState = mouseState;
        this.className = "row noDrag"
    }
}

customElements.define('dom-row', DOMRow, { extends: "div" });

export default DOMRow;