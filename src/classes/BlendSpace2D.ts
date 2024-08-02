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
    update(p: THREE.Vector2Like): [AnimationWeights[], AnimationWeights[]] {
        const animationWeights: AnimationWeights[] = [];

        // Find the closest three points to the direction
        const lengths: { id: string; distance: number }[] = [];
        this.animations.forEach((anim, id) => {
            const direction = { x: p.x - anim.position.x, y: p.y - anim.position.y };
            const length = direction.x * direction.x + direction.y * direction.y; // todo could probably just compare the square lengths?

            animationWeights.push({
                name: id,
                weight: 0,
            });

            lengths.push({ id, distance: length });
        });

        lengths.sort((a, b) => {
            return a.distance - b.distance;
        });

        const v1 = this.animations.get(lengths[0].id)!;
        const v2 = this.animations.get(lengths[1].id)!;
        let v3: BlendedAnimation | undefined = undefined;
        for (let i = 2; i < lengths.length; i++) {
            const anim = this.animations.get(lengths[i].id)!;

            // If the X and Y is _not_ same as the other two - accept it, otherwise it's degenerate
            if (
                anim.position.x !== (v1.position.x || v2.position.x) &&
                anim.position.y !== (v1.position.y || v2.position.y)
            ) {
                v3 = anim;
                break;
            }
        }

        if (!v3) {
            throw new Error('Invalid Blend Space!');
        }

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

        // todo - need to project the point back onto the triangle...?

        // Max to 0... ? todo - make sure these all add up to 1 w/o going negative... clamp to triangle edges somehow
        W1 = Math.max(0, W1);
        W2 = Math.max(0, W2);
        W3 = Math.max(0, W3);

        let sum = W1 + W2 + W3;
        W1 = W1 > 0 ? W1 / sum : 0;
        W2 = W2 > 0 ? W2 / sum : 0;
        W3 = W3 > 0 ? W3 / sum : 0;

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

        // Return a sorted list (by lengths, not weights)
        // animationWeights.sort((a, b) => {
        //     const index1 = lengths.findIndex(l => l.id === a.name);
        //     const index2 = lengths.findIndex(l => l.id === b.name);

        //     return index1 - index2;
        // });

        // Sort by weights
        animationWeights.sort((a, b) => {
            return b.weight - a.weight;
        });

        // console.log('\n\n\n');
        // console.log(W1, W2, W3);
        // console.log(W1 + W2 + W3);

        const visData = [
            animationWeights.find(w => w.name === v1.name)!,
            animationWeights.find(w => w.name === v2.name)!,
            animationWeights.find(w => w.name === v3.name)!,
        ];

        return [animationWeights, visData];
    }
}
