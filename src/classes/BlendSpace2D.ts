import * as THREE from 'three';

export interface BlendedAnimation {
    name: string;
    position: THREE.Vector2Like;
}

export interface AnimationWeights {
    name: string;
    weight: number;
}

// Helper class to calculate weights for a given set of animations based on direction
export class BlendSpace2D {
    private readonly animations: Map<string, BlendedAnimation>;

    private readonly dirHelper: THREE.Vector2;
    private readonly posHelper: THREE.Vector2;

    constructor() {
        this.animations = new Map();

        this.dirHelper = new THREE.Vector2();
        this.posHelper = new THREE.Vector2();
    }

    addAnimations(anims: BlendedAnimation[]) {
        anims.forEach(anim => this.animations.set(anim.name, anim));
    }

    removeAnimations(anims: BlendedAnimation[]) {
        anims.forEach(anim => this.animations.delete(anim.name));
    }

    update(direction: THREE.Vector2Like): AnimationWeights[] {
        const animationWeights: AnimationWeights[] = [];
        this.dirHelper.set(direction.x, direction.y);
        const dirLength = this.dirHelper.length();

        let weightSum = 0;
        this.animations.forEach(anim => {
            this.posHelper.set(anim.position.x, anim.position.y).normalize();

            const normalizedDirection = this.dirHelper.clone().normalize();
            const dotP = this.posHelper.dot(normalizedDirection);

            const weight = Math.max(0, dotP);
            weightSum += weight;

            animationWeights.push({ name: anim.name, weight });
        });

        // Normalise
        animationWeights.forEach(animWeight => {
            animWeight.weight = animWeight.weight > 0 ? (animWeight.weight / weightSum) * dirLength : 0;
        });

        return animationWeights;
    }
}
