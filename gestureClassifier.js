/**
 * Modul 4 – Gesture Classification (Regelbasiert)
 * Klassifiziert Fingerzustände in Systemzustände mittels State Machine.
 * Portiert von gesture_classifier.py
 */

import { getFingerCount } from './fingerState.js';

// Systemzustände
export const IDLE = 'IDLE';
export const DRAW = 'DRAW';
export const ERASE = 'ERASE';
export const THICKNESS_ADJUST = 'THICKNESS_ADJUST';
export const COLOR_SWITCH = 'COLOR_SWITCH';

// Anzahl aufeinanderfolgender Frames für stabile Erkennung
const STABILITY_FRAMES = 3;

export class GestureClassifier {
    /**
     * @param {number} colorSwitchCooldown - Sekunden zwischen Farbwechseln
     */
    constructor(colorSwitchCooldown = 0.8) {
        this.colorSwitchCooldown = colorSwitchCooldown;
        this.lastColorSwitchTime = 0;
        this.colorSwitched = false;

        // Temporale Glättung
        this._gestureHistory = [];
        this._currentStableGesture = IDLE;
    }

    /**
     * Klassifiziert den aktuellen Fingerzustand.
     * @param {number[]} fingers - [thumb, index, middle, ring, pinky] als [0|1]
     * @param {number|null} indexY - Y-Position der Zeigefingerspitze
     * @returns {[string, number]} [gesture_name, delta_y]
     */
    classify(fingers, indexY = null) {
        const fingerCount = getFingerCount(fingers);
        let rawGesture = IDLE;

        // Mindestens 4 Finger oben → ERASE
        if (fingerCount >= 4 && fingers[1] === 1) {
            rawGesture = ERASE;
        }
        // Nur kleiner Finger oben (oder kleiner + Daumen)
        else if (fingers[4] === 1 && fingers[1] === 0 && fingers[2] === 0 && fingers[3] === 0) {
            rawGesture = COLOR_SWITCH;
        }
        // Nur Zeigefinger oben (Daumen darf auch oben sein)
        else if (fingers[1] === 1 && fingers[2] === 0 && fingers[3] === 0 && fingers[4] === 0) {
            rawGesture = DRAW;
        }

        // Temporale Glättung
        const stableGesture = this._applyTemporalSmoothing(rawGesture);

        // Aktionen basierend auf stabilem Gesture
        if (stableGesture === ERASE) {
            this.colorSwitched = false;
            return [ERASE, 0];
        }

        if (stableGesture === COLOR_SWITCH) {
            const now = performance.now() / 1000;
            if (!this.colorSwitched && (now - this.lastColorSwitchTime) > this.colorSwitchCooldown) {
                this.lastColorSwitchTime = now;
                this.colorSwitched = true;
                return [COLOR_SWITCH, 0];
            }
            return [IDLE, 0];
        }

        // Kleiner Finger nicht mehr oben → Debounce zurücksetzen
        if (stableGesture !== COLOR_SWITCH) {
            this.colorSwitched = false;
        }

        if (stableGesture === DRAW) {
            return [DRAW, 0];
        }

        // IDLE
        return [IDLE, 0];
    }

    /**
     * Wendet temporale Glättung an.
     * @param {string} rawGesture
     * @returns {string} Stabile Geste
     */
    _applyTemporalSmoothing(rawGesture) {
        this._gestureHistory.push(rawGesture);

        if (this._gestureHistory.length > STABILITY_FRAMES) {
            this._gestureHistory = this._gestureHistory.slice(-STABILITY_FRAMES);
        }

        if (this._gestureHistory.length >= STABILITY_FRAMES) {
            const lastN = this._gestureHistory.slice(-STABILITY_FRAMES);
            if (lastN.every(g => g === rawGesture)) {
                this._currentStableGesture = rawGesture;
            }
        }

        return this._currentStableGesture;
    }
}
