import * as THREE from 'three';
import { AssetManager } from './AssetManager';

export class Player extends THREE.Group {
    private readonly mesh: THREE.Group;
    private readonly mixer: THREE.AnimationMixer;
    private readonly _animations: Map<string, THREE.AnimationAction>;

    private readonly direction: THREE.Vector3;
    private readonly destination: THREE.Vector3;

    private arrowHelper: THREE.ArrowHelper;

    constructor(private readonly assetManager: AssetManager) {
        super();

        this.direction = new THREE.Vector3(0, 0, -1);
        this.destination = new THREE.Vector3();

        this.arrowHelper = new THREE.ArrowHelper(this.direction, new THREE.Vector3(), 1, undefined, 0.5, 0.25);

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

        //this._animations.get('idle')!.weight = 1;
    }

    update(dt: number) {
        /*
        // Move the entity itself
        // Find the direction
        const targetDirection = this.destination.clone().sub(this.position);
        const distance = targetDirection.length();
        targetDirection.normalize();

        let angle = this.direction.angleTo(targetDirection);

        // clamp the max turn rate, w/ regard to speed (and some magic numbers)
        angle = Math.min(Math.abs(angle), THREE.MathUtils.degToRad(1)) * Math.sign(angle);

        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.arrowHelper.setDirection(this.direction);
        //console.log(direction);

        //if (distance > 0.01) {

        if (distance > 0.01) {
            this.speed = this.maxSpeed;
        } else {
            this.position.copy(this.destination);
            this.speed = 0;
        }

        // const distanceDeceleration = this.decelerationSpeed / distance;
        // //console.log(distanceDeceleration);
        // if (distanceDeceleration >= 1) {
        //     this.speed -= dt * this.decelerationSpeed;
        //     //console.log('slowing down!');
        // } else {
        //     this.speed += dt * this.accelerationSpeed;
        //     //console.log('speeding up!');
        // }

        // Clamping
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
        //console.log(this.speed);

        // Take a step
        const step = this.direction.clone().multiplyScalar(dt * this.speed);
        // Make sure we don't overshoot
        const stepLength = step.length();

        if (stepLength > distance) {
            step.multiplyScalar(distance / stepLength);
        }

        this.position.add(step);
        //}

        // Update our animations
        */

        this.mixer.update(dt);
    }

    setDestination(p: THREE.Vector3) {
        this.destination.copy(p);

        this.updateAnimationWeights();

        //console.log(p);
    }

    private updateAnimationWeights() {
        const direction = this.destination.clone().sub(this.position).normalize();
        this.arrowHelper.setDirection(direction);

        let dot: number;
        let sum: number = 0;

        const forward = this._animations.get('running')!;
        const backward = this._animations.get('running_back')!;
        const left = this._animations.get('strafe_left')!;
        const right = this._animations.get('strafe_right')!;

        // forward
        const tempVec = new THREE.Vector3(0, 0, 1);
        dot = tempVec.dot(direction);
        forward.weight = Math.max(0, dot);
        sum += forward.weight;

        // backward
        tempVec.set(0, 0, -1);
        dot = tempVec.dot(direction);
        backward.weight = Math.max(0, dot);
        sum += backward.weight;

        // left
        tempVec.set(1, 0, 0);
        dot = tempVec.dot(direction);
        left.weight = Math.max(0, dot);
        sum += left.weight;

        // right
        tempVec.set(-1, 0, 0);
        dot = tempVec.dot(direction);
        right.weight = Math.max(0, dot);
        sum += right.weight;

        forward.weight = forward.weight > 0 ? forward.weight / sum : 0;
        backward.weight = backward.weight > 0 ? backward.weight / sum : 0;
        left.weight = left.weight > 0 ? left.weight / sum : 0;
        right.weight = right.weight > 0 ? right.weight / sum : 0;

        const anims = [forward, backward, left, right];

        // Find the priority anim
        const priorityAnim = anims.reduce((a, b) => (a.weight > b.weight ? a : b));
        priorityAnim.setEffectiveTimeScale(1);
        const priorityClipDuration = priorityAnim.getClip().duration;

        // Force the other anims to match their lengths to this one
        anims.forEach(action => {
            if (action === priorityAnim) return;

            const scaledDuration = action.getClip().duration / priorityClipDuration;
            action.setEffectiveTimeScale(scaledDuration);
            action.time = priorityAnim.time;

            console.log(action.timeScale);
        });

        console.log(forward.weight, backward.weight, left.weight, right.weight);

        //this.mixer.update(dt);
    }
}
