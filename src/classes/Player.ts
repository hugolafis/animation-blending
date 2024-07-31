import * as THREE from 'three';
import { AssetManager } from './AssetManager';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { InputManager } from './InputManager';
import { lerp } from 'three/src/math/MathUtils';

export class Player extends THREE.Group {
    private readonly mesh: THREE.Group;
    private readonly mixer: THREE.AnimationMixer;
    private readonly _animations: Map<string, THREE.AnimationAction>;

    private readonly velocity: THREE.Vector3;
    private maxSpeed = 3.5;

    private arrowHelper: THREE.ArrowHelper;

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

        this._animations = new Map();
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const meshAnimations = this.assetManager.animations.get('character');
        meshAnimations?.forEach(animClip => {
            const action = this.mixer.clipAction(animClip);
            action.weight = 0;
            action.play();
            this._animations.set(animClip.name, action);
        });
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

    private updateAnimationWeights() {
        const direction = this.velocity.clone().normalize();
        direction.applyQuaternion(this.mesh.quaternion);
        this.arrowHelper.setDirection(direction);
        const speed = this.velocity.length();
        this.arrowHelper.setLength(speed);

        const speedQuotient = speed / this.maxSpeed;
        const speedFactor = lerp(0, 1, speedQuotient);

        const walkSpeedQuotient = speed / 3; // magic number to flip between running and walking (m/s)
        const walkSpeedFactor = lerp(0, 1, walkSpeedQuotient * 1.5);

        const walkRunMixQuotient = Math.min(1, walkSpeedQuotient);
        const walkRunMix = lerp(0, 1, walkRunMixQuotient);

        let dot: number;
        let sum: number = 0;

        const forwardRun = this._animations.get('running')!;
        const backwardRun = this._animations.get('running_back')!;
        const leftRun = this._animations.get('running_left')!;
        const rightRun = this._animations.get('running_right')!;

        const forwardWalk = this._animations.get('walking')!;
        const backwardWalk = this._animations.get('walking_back')!;
        const leftWalk = this._animations.get('walking_left')!;
        const rightWalk = this._animations.get('walking_right')!;

        // forward
        const tempVec = new THREE.Vector3(0, 0, 1);
        dot = tempVec.dot(direction);
        forwardRun.weight = Math.max(0, dot) * walkRunMix;
        forwardWalk.weight = Math.max(0, dot) * (1.0 - walkRunMix);
        sum += forwardRun.weight;
        sum += forwardWalk.weight;

        // backward
        tempVec.set(0, 0, -1);
        dot = tempVec.dot(direction);
        backwardRun.weight = Math.max(0, dot) * walkRunMix;
        backwardWalk.weight = Math.max(0, dot) * (1.0 - walkRunMix);
        sum += backwardRun.weight;
        sum += backwardWalk.weight;

        // left
        tempVec.set(1, 0, 0);
        dot = tempVec.dot(direction);
        leftRun.weight = Math.max(0, dot) * walkRunMix;
        leftWalk.weight = Math.max(0, dot) * (1.0 - walkRunMix);
        sum += leftRun.weight;
        sum += leftWalk.weight;

        // right
        tempVec.set(-1, 0, 0);
        dot = tempVec.dot(direction);
        rightRun.weight = Math.max(0, dot) * walkRunMix;
        rightWalk.weight = Math.max(0, dot) * (1.0 - walkRunMix);
        sum += rightRun.weight;
        sum += rightWalk.weight;

        forwardRun.weight = forwardRun.weight > 0 ? forwardRun.weight / sum : 0;
        backwardRun.weight = backwardRun.weight > 0 ? backwardRun.weight / sum : 0;
        leftRun.weight = leftRun.weight > 0 ? leftRun.weight / sum : 0;
        rightRun.weight = rightRun.weight > 0 ? rightRun.weight / sum : 0;

        forwardWalk.weight = forwardWalk.weight > 0 ? forwardWalk.weight / sum : 0;
        backwardWalk.weight = backwardWalk.weight > 0 ? backwardWalk.weight / sum : 0;
        leftWalk.weight = leftWalk.weight > 0 ? leftWalk.weight / sum : 0;
        rightWalk.weight = rightWalk.weight > 0 ? rightWalk.weight / sum : 0;

        const anims = [forwardRun, backwardRun, leftRun, rightRun, forwardWalk, backwardWalk, leftWalk, rightWalk];

        // Find the priority anim
        const priorityAnim = anims.reduce((a, b) => (a.weight > b.weight ? a : b));

        let finalSpeedFactor = priorityAnim.getClip().name.includes('walk') ? walkSpeedFactor : speedFactor;

        //priorityAnim.setEffectiveTimeScale(finalSpeedFactor);
        priorityAnim.setEffectiveTimeScale(1);

        //console.log(speedFactor);
        const priorityClipDuration = priorityAnim.getClip().duration;

        // Force the other anims to match their lengths to this one
        anims.forEach(action => {
            if (action === priorityAnim) return;

            const scaledDuration = action.getClip().duration / priorityClipDuration;
            action.setEffectiveTimeScale(scaledDuration);
            action.time = priorityAnim.time;

            //console.log(action.timeScale);
        });
    }
}
