export class InputManager {
    readonly heldKeys: Set<string>;

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.heldKeys = new Set();

        this.canvas.addEventListener('keydown', this.onKeyDown);
        this.canvas.addEventListener('keyup', this.onKeyUp);
        this.canvas.addEventListener('focusout', this.onFocusLoss);
    }

    private readonly onKeyDown = (e: KeyboardEvent) => this.heldKeys.add(e.key);
    private readonly onKeyUp = (e: KeyboardEvent) => this.heldKeys.delete(e.key);
    private readonly onFocusLoss = () => this.heldKeys.clear();
}
