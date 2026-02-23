/**
 * Sign Language Classifier using geometry heuristics.
 * MediaPipe landmarks indices:
 * 0: WRIST
 * 4: THUMB_TIP
 * 8: INDEX_FINGER_TIP
 * 12: MIDDLE_FINGER_TIP
 * 16: RING_FINGER_TIP
 * 20: PINKY_TIP
 */

class SignClassifier {
    /**
     * @param {Array} landmarks - Array of [x, y, z] for 21 points
     */
    static classify(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;

        const isExtended = (tip, pip, base) => {
            // In MediaPipe, Y decreases upwards. 
            // So tip.y < base.y means the finger is "up".
            // A better check is if tip-pip distance + pip-base distance is almost equal to tip-base distance
            // but for simple signs, relative Y position and distance from wrist work well.
            return tip[1] < pip[1] && pip[1] < base[1];
        };

        const thumb = landmarks[4];
        const index = landmarks[8];
        const middle = landmarks[12];
        const ring = landmarks[16];
        const pinky = landmarks[20];
        const wrist = landmarks[0];

        // Finger bases or PIPs for reference
        const indexBase = landmarks[5];
        const middleBase = landmarks[9];
        const ringBase = landmarks[13];
        const pinkyBase = landmarks[17];

        const indexExtended = isExtended(index, landmarks[6], indexBase);
        const middleExtended = isExtended(middle, landmarks[10], middleBase);
        const ringExtended = isExtended(ring, landmarks[14], ringBase);
        const pinkyExtended = isExtended(pinky, landmarks[18], pinkyBase);

        // 1. Peace Sign (Index and Middle extended, others curled)
        if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
            return "Peace";
        }

        // 2. Hello / Wave (All fingers extended)
        if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
            return "Hello";
        }

        // 3. Like / Thumbs Up (Thumb up, others curled)
        // Thumb is tricky, check if thumb tip is significantly higher than other tips
        if (thumb[1] < index[1] && thumb[1] < middle[1] && !indexExtended && !middleExtended) {
            return "Thumbs Up";
        }

        // 4. Fist (All fingers curled)
        if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
            return "Fist";
        }

        // 5. Pointing (Only index extended)
        if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
            return "Pointing";
        }

        return null;
    }
}

module.exports = SignClassifier;
