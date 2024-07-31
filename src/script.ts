import { AssetManager } from './classes/AssetManager';
import { Viewer } from './classes/Viewer';
import './style.css';
import * as THREE from 'three';

// Canvas
const canvas = document.querySelector<HTMLCanvasElement>('canvas.webgl');
const clock = new THREE.Clock();

if (!canvas) {
    throw new Error('Canvas not found!');
}

/**
 * Renderer
 */
THREE.ColorManagement.enabled = true;
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true, // MSAA
});
renderer.setPixelRatio(1); // for DPI scaling set to window.devicePixelRatio
renderer.setSize(1, 1, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.25;
let viewer: Viewer;

function init() {
    clock.start();

    viewer = new Viewer(renderer, canvas!, loader);

    update();
}

function update() {
    // Calculate delta
    const delta = clock.getDelta();

    // Update the viewer
    viewer.update(delta);

    window.requestAnimationFrame(update);
}

const loader = new AssetManager();
loader.load().then(() => {
    const loadingDiv = document.getElementById('load-screen')!;
    loadingDiv.remove();
    init();
});

//init();
