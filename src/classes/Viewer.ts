import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AssetManager } from './AssetManager';
import { Player } from './Player';

export class Viewer {
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;
    private readonly scene: THREE.Scene;

    private readonly canvasSize: THREE.Vector2;
    private readonly renderSize: THREE.Vector2;

    private readonly player: Player;

    private helper: THREE.Mesh;

    // testing
    private elapsed = 5;

    constructor(
        private readonly renderer: THREE.WebGLRenderer,
        private readonly canvas: HTMLCanvasElement,
        private readonly assetManager: AssetManager
    ) {
        this.canvasSize = new THREE.Vector2();
        this.renderSize = new THREE.Vector2();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight);
        this.camera.position.set(3, 3, 3);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, 1, 0);

        const sun = new THREE.DirectionalLight(undefined, Math.PI); // undo physically correct changes
        sun.position.copy(new THREE.Vector3(0.75, 1, 0.5).normalize());
        const ambient = new THREE.AmbientLight(undefined, 0.25);
        this.scene.add(sun);
        this.scene.add(ambient);

        this.player = new Player(this.assetManager);
        this.scene.add(this.player);

        const gridHelper = new THREE.GridHelper(25, 24);
        this.scene.add(gridHelper);

        this.helper = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        this.scene.add(this.helper);

        // const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhysicalMaterial());
        // this.scene.add(mesh);
    }

    readonly update = (dt: number) => {
        this.controls.update();

        this.elapsed += dt;

        if (this.elapsed >= 5) {
            console.log('\n\n finding new target!');
            this.elapsed = this.elapsed % 5;

            // Find a random point in X/Z
            const randX = Math.random() * 25 - 12.5;
            const randZ = Math.random() * 25 - 12.5;

            const destination = new THREE.Vector3(randX, 0.0, randZ);
            this.player.setDestination(destination);
            this.helper.position.copy(destination);
        }

        // Do we need to resize the renderer?
        this.canvasSize.set(
            Math.floor(this.canvas.parentElement!.clientWidth),
            Math.floor(this.canvas.parentElement!.clientHeight)
        );
        if (!this.renderSize.equals(this.canvasSize)) {
            this.renderSize.copy(this.canvasSize);
            this.renderer.setSize(this.renderSize.x, this.renderSize.y, false);

            this.camera.aspect = this.renderSize.x / this.renderSize.y;
            this.camera.updateProjectionMatrix();
        }

        this.player.update(dt);

        this.renderer.render(this.scene, this.camera);
    };
}
