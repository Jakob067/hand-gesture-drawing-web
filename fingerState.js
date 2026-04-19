/**
 * Modul 3 – Finger State Estimation
 * Bestimmt den binären Zustand jedes Fingers (oben/unten).
 * Portiert von finger_state.py
 */

// MediaPipe Landmark-Indizes
const FINGER_TIP_IDS = [4, 8, 12, 16, 20];
const FINGER_PIP_IDS = [3, 6, 10, 14, 18];
const FINGER_MCP_IDS = [2, 5, 9, 13, 17];

// Schwellenwert (Pixel-Differenz) für stabile Erkennung
const FINGER_MARGIN = 15;

/**
 * Bestimmt welche Finger gestreckt (oben) sind.
 * @param {Array|null} landmarks - 21 Landmark-Punkte [{x, y, z}, ...]
 * @param {number} width - Canvas-Breite in Pixel
 * @param {number} height - Canvas-Höhe in Pixel
 * @returns {number[]} [thumb, index, middle, ring, pinky] (1=oben, 0=unten)
 */
export function estimateFingerStates(landmarks, width, height) {
  if (!landmarks || landmarks.length < 21) {
    return [0, 0, 0, 0, 0];
  }

  const fingers = [];

  // --- Daumen: x-Koordinaten-Vergleich ---
  const thumbTip = landmarks[FINGER_TIP_IDS[0]];
  const thumbIp = landmarks[FINGER_PIP_IDS[0]];

  // Handseite bestimmen (gespiegeltes Bild)
  const wrist = landmarks[0];
  const pinkyMcp = landmarks[17];

  // Normalisierte Koordinaten → Pixel
  const wristX = wrist.x * width;
  const pinkyMcpX = pinkyMcp.x * width;
  const thumbTipX = thumbTip.x * width;
  const thumbIpX = thumbIp.x * width;

  let thumbDiff;
  if (wristX < pinkyMcpX) {
    // Rechte Hand (im gespiegelten Bild)
    thumbDiff = thumbIpX - thumbTipX;
  } else {
    // Linke Hand
    thumbDiff = thumbTipX - thumbIpX;
  }
  fingers.push(thumbDiff > FINGER_MARGIN ? 1 : 0);

  // --- Zeigefinger bis kleiner Finger: y-Vergleich ---
  for (let i = 1; i < 5; i++) {
    const tip = landmarks[FINGER_TIP_IDS[i]];
    const pipJoint = landmarks[FINGER_PIP_IDS[i]];

    const tipY = tip.y * height;
    const pipY = pipJoint.y * height;

    // Tip muss mindestens FINGER_MARGIN Pixel über PIP sein
    // (y-Achse geht nach unten, also pipY - tipY > margin)
    const diff = pipY - tipY;
    fingers.push(diff > FINGER_MARGIN ? 1 : 0);
  }

  return fingers;
}

/**
 * Zählt die Anzahl gestreckter Finger.
 * @param {number[]} fingers - Binäre Liste [thumb, index, middle, ring, pinky]
 * @returns {number} Anzahl gestreckter Finger (0-5)
 */
export function getFingerCount(fingers) {
  return fingers.reduce((sum, f) => sum + f, 0);
}
