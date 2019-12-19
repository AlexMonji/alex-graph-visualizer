class AnimationControls extends HTMLElement {

    constructor() {
        super();
        this.innerHTML = `<button id="play-button" class="play" disabled></button>
                          <input id="animation-progress" type="range" value="0" min="0" max="0" step="1" disabled/>
                          <output><span id="animation-index">0</span>/<span id="animation-index-max">0</span></output>`;

        this._max = 0;
        this._value = 0;
        this.animationPrevIndex = 0;
        this.playButton = null;
        this.animationProgress = null;
        this.animationIndex = null;
        this.animationIndexMax = null;
    }

    connectedCallback() {
        this.playButton = this.querySelector("#play-button");
        this.animationProgress = this.querySelector("#animation-progress");
        this.animationIndex = this.querySelector("#animation-index");
        this.animationIndexMax = this.querySelector("#animation-index-max");
    }

    set value(value) {
        this.animationPrevIndex = this._value;
        this._value = value;
        this._update();
    }

    get value() {
        return this._value;
    }

    set max(value) {
        this._max = value;
        this._update();
    }

    get max() {
        return this._max;
    }

    set disabled(value) {
        value = Boolean(value);
        if (value) {
            this.setAttribute("disabled", value);
            this.animationProgress.disabled = true;
            this.playButton.disabled = true;
        } else {
            this.removeAttribute('disabled');
            this.animationProgress.disabled = false;
            this.playButton.disabled = false;
        }
    }

    get disabled(){
        return this.hasAttribute("disabled");
    }

    clear() {
        this.max = 0;
        this.value = 0;
    }

    _update(value) {
        if (value != undefined) {this._value = value;}
        this.animationProgress.max = this._max;
        this.animationProgress.value = this._value;
        if (this.animationProgress.max == 0) {
            this.animationProgress.style.background = `#fff`
        } else {
            this.animationProgress.style.background = `linear-gradient(to right, #ff0000 0%, #ff0000 ${((this.animationProgress.value/this.animationProgress.max)*100).toFixed(2)}%, #fff ${((this.animationProgress.value/this.animationProgress.max)*100).toFixed(2)}%, white 100%)`
        }
        this.animationIndex.textContent = this.animationProgress.value;
        this.animationIndexMax.textContent = this.animationProgress.max;
    }

}

window.customElements.define('animation-controls', AnimationControls);

export default AnimationControls;
