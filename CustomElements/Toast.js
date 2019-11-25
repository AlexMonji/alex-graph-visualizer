class Toast extends HTMLDivElement {
    constructor() {
        super();
    }

    // A getter/setter for an open property.
    get open() {
        return this.hasAttribute('open');
    }

    set open(val) {
        // Reflect the value of the open property as an HTML attribute.
        if (val) {
            this.setAttribute('open', '');
        } else {
            this.removeAttribute('open');
        }
    }

    

}

customElements.define("custom-toast", Toast);

export default Toast;