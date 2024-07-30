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

        this.fbxLoader.load('/assets/strafe_left.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'strafe_left';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/strafe_right.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'strafe_right';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });

        this.fbxLoader.load('/assets/idle.fbx', data => {
            const existingClips: THREE.AnimationClip[] = this.animations.get('character') ?? [];
            data.animations[0].name = 'idle';

            existingClips.push(...data.animations);
            this.animations.set('character', existingClips);
        });
    }
}
