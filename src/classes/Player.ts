import * as THREE from 'three';
import { AssetManager } from './AssetManager';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { InputManager } from './InputManager';
import { lerp } from 'three/src/math/MathUtils';
import { BlendSpace2D } from './BlendSpace2D';

export class Player extends THREE.Group {
    private readonly mesh: THREE.Group;
    private readonly mixer: THREE.AnimationMixer;
    private readonly _animations: Map<string, THREE.AnimationAction>;

    private readonly velocity: THREE.Vector3;
    private maxSpeed = 3.5;

    private arrowHelper: THREE.ArrowHelper;

    private readonly walkingBlend: BlendSpace2D;
    private readonly runningBlend: BlendSpace2D;

    constructor(
        private readonly camera: THREE.Camera,
        //private readonly controls: OrbitControls,
        private readonly inputManager: InputManager,
        private readonly assetManager: AssetManager
    ) {
        super();

        this.camera.position.set(0, 3, -3);
        this.camera.lookAt(new THREE.Vector3(0, 1, 0));
        //this.controls.target.set(0, 1, 0);

        this.add(this.camera);

        this.velocity = new THREE.Vector3(0, 0, 0);

        this.arrowHelper = new THREE.ArrowHelper(this.velocity, new THREE.Vector3(), 1, undefined, 0.5, 0.25);

        this.mesh = this.assetManager.meshes.get('character')!;
        this.mesh.scale.multiplyScalar(0.01);

        this.add(this.mesh, this.arrowHelper);

        this.walkingBlend = new BlendSpace2D();
        this.runningBlend = new BlendSpace2D();
        this.walkingBlend.addAnimations([
            {
                name: 'walking',
                position: { x: 0, y: 1 },
            },
            {
                name: 'walking_back',
                position: { x: 0, y: -1 },
            },
            {
                name: 'walking_left',
                position: { x: 1, y: 0 },
            },
            {
                name: 'walking_right',
                position: { x: -1, y: 0 },
            },
        ]);
        this.runningBlend.addAnimations([
            {
                name: 'running',
                position: { x: 0, y: 1 },
            },
            {
                name: 'running_back',
                position: { x: 0, y: -1 },
            },
            {
                name: 'running_left',
                position: { x: 1, y: 0 },
            },
            {
                name: 'running_right',
                position: { x: -1, y: 0 },
            },
        ]);

        this._animations = new Map();
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const meshAnimations = this.assetManager.animations.get('character');
        meshAnimations?.forEach(animClip => {
            const action = this.mixer.clipAction(animClip);
            action.weight = 0;

            // Diagonal backwards needs to reversed
            if (animClip.name.includes('back_')) {
                action.setEffectiveTimeScale(-1);
            }

            action.play();
            this._animations.set(animClip.name, action);
        });

        // Manually insert some for diagonals...
        // Intentionally need the opposite direction
        // const walking_back_left = this._animations.get('walking_right')!;
        // const walking_back_right = this._animations.get('walking_left')!;
        // this._animations.set('walking_back_left', walking_back_left);
        // this._animations.set('walking_back_right', walking_back_right);
    }

    update(dt: number) {
        // todo replace this with a controls class that supports being attached to something
        //this.controls.target.copy(this.position).add({ x: 0, y: 1, z: 0 });

        // Rotate player mesh to face camera dir - todo do this properly
        const lookDir = this.camera.position.clone().normalize();
        lookDir.y = 0;
        lookDir.normalize();
        lookDir.multiplyScalar(-1);
        lookDir.add(this.position);
        this.mesh.lookAt(lookDir);

        // Moving
        const step = new THREE.Vector3();
        if (this.inputManager.heldKeys.has('w')) {
            step.add({ x: 0, y: 0, z: -1 });
        }

        if (this.inputManager.heldKeys.has('s')) {
            step.add({ x: 0, y: 0, z: 1 });
        }

        if (this.inputManager.heldKeys.has('a')) {
            step.add({ x: -1, y: 0, z: 0 });
        }

        if (this.inputManager.heldKeys.has('d')) {
            step.add({ x: 1, y: 0, z: 0 });
        }

        step.applyQuaternion(this.camera.quaternion);
        step.y = 0;
        step.normalize().multiplyScalar(0.1);

        this.velocity.add(step);

        let clampedLength = this.velocity.length();

        clampedLength = this.maxSpeed / clampedLength;
        //console.log(clampedLength);

        if (clampedLength < 1) {
            this.velocity.multiplyScalar(clampedLength);
        }

        this.position.add(this.velocity.clone().multiplyScalar(dt));

        this.updateAnimationWeights();

        this.mixer.update(dt);
    }

    private setWalkWeights() {
        //
    }

    private setRunWeights() {
        //
    }

    private updateAnimationWeights() {
        const direction = this.velocity.clone().normalize();
        direction.applyQuaternion(this.mesh.quaternion);
        this.arrowHelper.setDirection(direction);
        const speed = this.velocity.length();
        this.arrowHelper.setLength(speed);

        const idle = this._animations.get('idle')!;

        // TESTING CUSTOM BLEND
        const scaledDirectionWalking = direction.clone().multiplyScalar(Math.min(1, speed / 1.5)); // less than max speed
        const scaledDirectionRunning = direction.clone().multiplyScalar(speed / this.maxSpeed);

        let totalWeightSum = 0;
        const blendValues = this.walkingBlend.update({ x: scaledDirectionWalking.x, y: scaledDirectionWalking.z });
        blendValues.forEach(animValue => {
            const matchingAction = this._animations.get(animValue.name)!;
            matchingAction.weight = animValue.weight;
            totalWeightSum += animValue.weight;
        });

        // Edge cases
        // Need to reverse the weights / timescale for left/right if we're travelling backwards
        const backward = this._animations.get('walking_back')!;
        const leftWalk = this._animations.get('walking_left')!;
        const rightWalk = this._animations.get('walking_right')!;
        const backLeftWalk = this._animations.get('walking_back_left')!;
        const backRightWalk = this._animations.get('walking_back_right')!;

        if (backward.weight > 0) {
            backLeftWalk.weight = leftWalk.weight;
            backRightWalk.weight = rightWalk.weight;
            leftWalk.weight = 0;
            rightWalk.weight = 0;
        } else {
            backLeftWalk.weight = 0;
            backRightWalk.weight = 0;
        }

        idle.weight = 1.0 - totalWeightSum;

        let allAnims = Array.from(this._animations, ([_, v]) => v);
        allAnims = allAnims.filter(x => !x.getClip().name.includes('idle'));
        const priorityAnim = allAnims.reduce((a, b) => (a.weight > b.weight ? a : b));
        priorityAnim.setEffectiveTimeScale(1 * Math.sign(priorityAnim.timeScale));
        const priorityClipDuration = priorityAnim.getClip().duration;

        allAnims.forEach(action => {
            if (action === priorityAnim) return;

            const scaledDuration = action.getClip().duration / priorityClipDuration;
            action.setEffectiveTimeScale(scaledDuration * Math.sign(action.timeScale));
        });
    }
}
