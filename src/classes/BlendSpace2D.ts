import * as THREE from 'three';

export interface BlendedAnimation {
    name: string;
    position: THREE.Vector2Like;
}

export interface AnimationWeights {
    name: string;
    weight: number;
}

// // Helper class to calculate weights for a given set of animations based on direction
// export class BlendSpace2D {
//     private readonly animations: Map<string, BlendedAnimation>;

//     private readonly dirHelper: THREE.Vector2;
//     private readonly posHelper: THREE.Vector2;

//     constructor() {
//         this.animations = new Map();

//         this.dirHelper = new THREE.Vector2();
//         this.posHelper = new THREE.Vector2();
//     }

//     addAnimations(anims: BlendedAnimation[]) {
//         anims.forEach(anim => this.animations.set(anim.name, anim));
//     }

//     removeAnimations(anims: BlendedAnimation[]) {
//         anims.forEach(anim => this.animations.delete(anim.name));
//     }

//     update(direction: THREE.Vector2Like): AnimationWeights[] {
//         const animationWeights: AnimationWeights[] = [];
//         this.dirHelper.set(direction.x, direction.y);
//         const dirLength = this.dirHelper.length();

//         let weightSum = 0;
//         this.animations.forEach(anim => {
//             this.posHelper.set(anim.position.x, anim.position.y).normalize();

//             const normalizedDirection = this.dirHelper.clone().normalize();
//             const dotP = this.posHelper.dot(normalizedDirection);

//             const weight = Math.max(0, dotP);
//             weightSum += weight;

//             animationWeights.push({ name: anim.name, weight });
//         });

//         // Normalise
//         animationWeights.forEach(animWeight => {
//             animWeight.weight = animWeight.weight > 0 ? (animWeight.weight / weightSum) * dirLength : 0;
//         });

//         return animationWeights;
//     }
// }

// Will find the nearest 3 points to the input, then provide the weights interpolated between those points
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

    /**
     *
     * @param p Should have a maximum length of 1, and scale from 0 - 1
     */
    update(p: THREE.Vector2Like): AnimationWeights[] {
        const animationWeights: AnimationWeights[] = [];

        // Find the closest three points to the direction
        const lengths: { id: string; distance: number }[] = [];
        this.animations.forEach((anim, id) => {
            const direction = { x: p.x - anim.position.x, y: p.y - anim.position.y };
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y); // todo could probably just compare the square lengths?

            animationWeights.push({
                name: id,
                weight: 0,
            });

            lengths.push({ id, distance: length });
        });

        lengths.sort((a, b) => a.distance - b.distance);

        const v1 = this.animations.get(lengths[0].id)!;
        const v2 = this.animations.get(lengths[1].id)!;
        const v3 = this.animations.get(lengths[2].id)!;

        // Barycentric center calcs
        // prettier-ignore
        let W1 =
            (
                (v2.position.y - v3.position.y) * (p.x - v3.position.x) +
                (v3.position.x - v2.position.x) * (p.y - v3.position.y)
            ) / (   
                (v2.position.y - v3.position.y) * (v1.position.x - v3.position.x) +
                (v3.position.x - v2.position.x) * (v1.position.y - v3.position.y)
            );

        // prettier-ignore
        let W2 = 
        (
            (v3.position.y - v1.position.y) * (p.x - v3.position.x) + 
            (v1.position.x - v3.position.x) * (p.y - v3.position.y)
        ) / (
            (v2.position.y - v3.position.y) * (v1.position.x - v3.position.x) +
            (v3.position.x - v2.position.x) * (v1.position.y - v3.position.y)
        );

        let W3 = 1 - W1 - W2;

        // Max to 0... ?
        W1 = Math.max(0, W1);
        W2 = Math.max(0, W2);
        W3 = Math.max(0, W3);

        animationWeights.forEach(animWeight => {
            switch (animWeight.name) {
                case v1.name:
                    animWeight.weight = W1;
                    break;
                case v2.name:
                    animWeight.weight = W2;
                    break;
                case v3.name:
                    animWeight.weight = W3;
                    break;
                default:
                    break;
            }
        });

        // Return a sorted list
        animationWeights.sort((a, b) => a.weight - b.weight);

        // console.log('\n\n\n');
        // console.log(W1, W2, W3);
        // console.log(W1 + W2 + W3);

        return animationWeights;
    }
}
