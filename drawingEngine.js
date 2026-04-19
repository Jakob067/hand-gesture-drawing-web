/**
 * Modul 5 – Action Execution / Drawing Engine
 * Verwaltet den Zeichenzustand und führt Aktionen aus.
 * Portiert von drawing_engine.py
 */

// Farbpalette (RGB für Web)
export const COLOR_PALETTE = [
    '#3232FF',   // Blau
    '#FF3232',   // Rot
    '#32FF32',   // Grün
    '#FFFF00',   // Gelb
    '#FF00FF',   // Magenta
    '#FFA500',   // Orange
    '#FFFFFF',   // Weiß
];

// Dicke-Grenzen
const MIN_THICKNESS = 2;
const MAX_THICKNESS = 30;
const DEFAULT_THICKNESS = 5;

export class DrawingEngine {
    /**
     * @param {HTMLCanvasElement} canvas - Das Zeichen-Canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Zeichenzustand
        this.colorIndex = 0;
        this.color = COLOR_PALETTE[this.colorIndex];
        this.thickness = DEFAULT_THICKNESS;
        this.prevPosition = null;
        this.mode = 'IDLE';
    }

    /**
     * Führt die dem Gesture entsprechende Aktion aus.
     * @param {string} gesture - DRAW, ERASE, COLOR_SWITCH, IDLE
     * @param {{x: number, y: number}|null} fingertip - Zeigefingerspitze in Pixel
     * @param {Array|null} landmarks - Alle 21 Landmarks (normalisiert)
     */
    execute(gesture, fingertip = null, landmarks = null) {
        this.mode = gesture;

        if (gesture === 'DRAW') {
            if (this._isOnSlider(fingertip)) {
                this._adjustThicknessFromSlider(fingertip);
            } else {
                this._draw(fingertip);
            }
        } else if (gesture === 'ERASE') {
            this._eraseWithPalm(landmarks);
        } else if (gesture === 'COLOR_SWITCH') {
            this._switchColor();
        } else {
            // IDLE
            this.prevPosition = null;
        }
    }

    /**
     * Zeichnet eine Linie zum Fingertip.
     */
    _draw(fingertip) {
        if (!fingertip) {
            this.prevPosition = null;
            return;
        }

        if (this.prevPosition) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.prevPosition.x, this.prevPosition.y);
            this.ctx.lineTo(fingertip.x, fingertip.y);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        }

        this.prevPosition = { x: fingertip.x, y: fingertip.y };
    }

    /**
     * Radiert mit der Handfläche.
     * @param {Array|null} landmarks - Normalisierte Landmarks
     */
    _eraseWithPalm(landmarks) {
        this.prevPosition = null;

        if (!landmarks || landmarks.length < 21) return;

        // Handflächen-Zentrum berechnen (Landmarks 0, 5, 9, 13, 17)
        const palmIndices = [0, 5, 9, 13, 17];
        let cx = 0, cy = 0;
        for (const idx of palmIndices) {
            cx += landmarks[idx].x * this.width;
            cy += landmarks[idx].y * this.height;
        }
        cx = Math.round(cx / palmIndices.length);
        cy = Math.round(cy / palmIndices.length);

        // Dynamischen Radius berechnen
        const wristX = landmarks[0].x * this.width;
        const wristY = landmarks[0].y * this.height;
        const middleMcpX = landmarks[9].x * this.width;
        const middleMcpY = landmarks[9].y * this.height;
        const palmSize = Math.sqrt(
            (middleMcpX - wristX) ** 2 + (middleMcpY - wristY) ** 2
        );
        let eraseRadius = Math.round(palmSize * 0.6);
        eraseRadius = Math.max(30, Math.min(120, eraseRadius));

        // Kreis-Bereich radieren (clearArc)
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, eraseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * Wechselt zur nächsten Farbe.
     */
    _switchColor() {
        this.prevPosition = null;
        this.colorIndex = (this.colorIndex + 1) % COLOR_PALETTE.length;
        this.color = COLOR_PALETTE[this.colorIndex];
    }

    /**
     * Prüft ob Fingerspitze über dem Slider liegt.
     */
    _isOnSlider(fingertip) {
        if (!fingertip) return false;
        const { x, y } = fingertip;
        const sliderX = 20;
        const sliderY = 160;
        const sliderW = 40;
        const sliderH = 300;

        return (x >= sliderX - 20 && x <= sliderX + sliderW + 30 &&
                y >= sliderY - 30 && y <= sliderY + sliderH + 30);
    }

    /**
     * Passt Strichdicke basierend auf Slider-Position an.
     */
    _adjustThicknessFromSlider(fingertip) {
        const { y } = fingertip;
        const sliderY = 160;
        const sliderH = 300;

        const clampedY = Math.max(sliderY, Math.min(sliderY + sliderH, y));
        const ratio = (clampedY - sliderY) / sliderH;

        const thicknessRange = MAX_THICKNESS - MIN_THICKNESS;
        const newThickness = MAX_THICKNESS - Math.round(ratio * thicknessRange);

        this.thickness = Math.max(MIN_THICKNESS, Math.min(MAX_THICKNESS, newThickness));
        this.prevPosition = null;
    }

    /**
     * Löscht das gesamte Canvas.
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Aktualisiert Canvas-Größe.
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}
