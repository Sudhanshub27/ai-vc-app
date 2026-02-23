/**
 * Sign Language Classifier (Static, Geometry-Based)
 * MediaPipe Hands – 21 landmarks
 */

class SignClassifier {
    static classify(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;

        const isExtended = (tip, pip, base) =>
            tip[1] < pip[1] && pip[1] < base[1];

        const dist = (a, b) =>
            Math.sqrt(
                (a[0] - b[0]) ** 2 +
                (a[1] - b[1]) ** 2 +
                (a[2] - b[2]) ** 2
            );

        const wrist  = landmarks[0];
        const thumb  = landmarks[4];
        const index  = landmarks[8];
        const middle = landmarks[12];
        const ring   = landmarks[16];
        const pinky  = landmarks[20];

        const indexExt  = isExtended(index,  landmarks[6],  landmarks[5]);
        const middleExt = isExtended(middle, landmarks[10], landmarks[9]);
        const ringExt   = isExtended(ring,   landmarks[14], landmarks[13]);
        const pinkyExt  = isExtended(pinky,  landmarks[18], landmarks[17]);

        const allExt  = indexExt && middleExt && ringExt && pinkyExt;
        const noneExt = !indexExt && !middleExt && !ringExt && !pinkyExt;

        // ===============================
        // DIGITS 6–9 (thumb-touch rules)
        // ===============================
        const thumbIndexClose  = dist(thumb, index)  < 0.045;
        const thumbMiddleClose = dist(thumb, middle) < 0.045;
        const thumbRingClose   = dist(thumb, ring)   < 0.045;
        const thumbPinkyClose  = dist(thumb, pinky)  < 0.045;

        if (thumbPinkyClose && noneExt) return "Six";
        if (thumbRingClose  && noneExt) return "Seven";
        if (thumbMiddleClose && noneExt) return "Eight";
        if (thumbIndexClose && noneExt) return "Nine";

        // ===============================
        // W-WORDS (safe static versions)
        // ===============================
        if (
            indexExt && middleExt && ringExt && !pinkyExt &&
            dist(index, middle) < 0.05 &&
            dist(middle, ring) < 0.05
        ) return "What";

        if (middleExt && ringExt && !indexExt && !pinkyExt) return "Why";
        if (ringExt && !indexExt && !middleExt && !pinkyExt) return "When";
        if (pinkyExt && wrist[1] < pinky[1] && !indexExt && !middleExt && !ringExt)
            return "Where";

        // ===============================
        // DIGITS 1–5
        // ===============================
        if (indexExt && !middleExt && !ringExt && !pinkyExt) return "One";
        if (indexExt && middleExt && !ringExt && !pinkyExt) return "Two";
        if (indexExt && middleExt && ringExt && !pinkyExt) return "Three";
        if (allExt && thumb[0] < index[0]) return "Five";
        if (indexExt && middleExt && ringExt && pinkyExt) return "Four";

        // ===============================
        // COMMON WORDS (STABLE)
        // ===============================
        if (allExt) return "Hello";
        if (indexExt && middleExt && !ringExt && !pinkyExt) return "Peace";
        if (thumb[1] < index[1] && noneExt) return "Yes";
        if (noneExt) return "No";
        if (indexExt && !middleExt && !ringExt && !pinkyExt) return "Point";

        if (middleExt && !indexExt && !ringExt && !pinkyExt) return "Me";
        if (indexExt && wrist[1] < index[1]) return "You";
        if (pinkyExt && !indexExt && !middleExt && !ringExt) return "I";
        if (indexExt && pinkyExt && !middleExt && !ringExt) return "We";

        if (indexExt && wrist[1] < index[1]) return "Up";
        if (indexExt && wrist[1] > index[1]) return "Down";
        if (indexExt && index[0] < wrist[0]) return "Left";
        if (indexExt && index[0] > wrist[0]) return "Right";

        if (indexExt && middleExt && wrist[1] < middle[1]) return "Come";
        if (indexExt && middleExt && wrist[1] > middle[1]) return "Go";

        if (indexExt && dist(index, thumb) < 0.05) return "OK";
        if (pinkyExt && thumb[0] < index[0]) return "Call";
        if (pinkyExt && thumb[1] < wrist[1]) return "Drink";
        if (indexExt && middleExt && wrist[1] > middle[1]) return "Eat";

        if (noneExt && dist(index, wrist) < 0.08) return "Sleep";
        if (thumb[1] < wrist[1] && noneExt) return "Good";
        if (thumb[1] > wrist[1] && noneExt) return "Bad";
        if (noneExt && thumb[1] < wrist[1]) return "Love";

        if (indexExt && middleExt && ringExt && wrist[1] < middle[1])
            return "Thank You";
        if (indexExt && middleExt && ringExt && wrist[1] > middle[1])
            return "Sorry";

        if (indexExt && middleExt && dist(index, middle) > 0.1) return "Work";
        if (indexExt && ringExt && !middleExt) return "School";
        if (pinkyExt && ringExt && !indexExt) return "Family";
        if (indexExt && middleExt && pinkyExt && !ringExt) return "Friend";
        if (allExt && thumb[0] > index[0]) return "Home";
        if (noneExt && thumb[0] > index[0]) return "Help";

        return null;
    }
}

module.exports = SignClassifier;