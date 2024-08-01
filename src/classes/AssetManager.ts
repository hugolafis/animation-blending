import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class AssetManager {
    readonly meshes: Map<string, THREE.Group>;
    readonly animations: Map<string, THREE.AnimationClip[]>;
    private readonly loadingManager: THREE.LoadingManager;
    private readonly fbxLoader: FBXLoader;

    constructor() {
        this.loadingManager = new THREE.LoadingManager();
        this.fbxLoader = new FBXLoader(this.loadingManager);

        this.meshes = new Map();
        this.animations = new Map();
    }

    load(): Promise<void> {
        // Call loading methods here
        this.loadMeshes();
        this.loadAnimations();

        return new Promise(resolve => {
            this.loadingManager.onLoad = () => {
                resolve();
            };
        });
    }

    private loadMeshes() {
        this.fbxLoader.load('/assets/character.fbx', data => this.meshes.set('character', data));
    }

    private loadAnimations() {
        // Running
        this.fbxLoader.load('/assets/running.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'running';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/running_back.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'running_back';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/running_left.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'running_left';

            const backward_right = data.animations[0].clone();
            backward_right.name = 'running_back_right';

            existingClips.push(...data.animations, backward_right);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/running_right.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'running_right';

            const backward_left = data.animations[0].clone();
            backward_left.name = 'running_back_left';

            existingClips.push(...data.animations, backward_left);
            this.animations.set('character', existingClips);
        });

        // Walking
        this.fbxLoader.load('/assets/walking.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'walking';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/walking_back.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'walking_back';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/walking_left.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'walking_left';
            const backward_right = data.animations[0].clone();
            backward_right.name = 'walking_back_right';

            existingClips.push(...data.animations, backward_right);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/walking_right.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'walking_right';
            const backward_left = data.animations[0].clone();
            backward_left.name = 'walking_back_left';

            existingClips.push(...data.animations, backward_left);
            this.animations.set('character', existingClips);
        });

        // Idle
        this.fbxLoader.load('/assets/idle.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'idle';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });
    }
}
