/**
 * Modul 6 – Rendering Engine
 * Kombiniert Kamerabild mit Canvas und zeichnet ein HUD-Overlay.
 * Portiert von renderer.py
 */

// Modus-Farben
const MODE_COLORS = {
    IDLE:             '#969696',
    DRAW:             '#32FF32',
    ERASE:            '#FF3232',
    THICKNESS_ADJUST: '#FFFF00',
    COLOR_SWITCH:     '#FF00FF',
};

export class Renderer {
    /**
     * @param {HTMLCanvasElement} cameraCanvas - Canvas für Kamerabild + Compositing
     * @param {HTMLCanvasElement} hudCanvas - Canvas für HUD-Overlay
     */
    constructor(cameraCanvas, hudCanvas) {
        this.cameraCanvas = cameraCanvas;
        this.cameraCtx = cameraCanvas.getContext('2d');
        this.hudCanvas = hudCanvas;
        this.hudCtx = hudCanvas.getContext('2d');
    }

    /**
     * Zeichnet den Kamera-Frame (horizontal gespiegelt).
     * @param {HTMLVideoElement} video
     */
    renderCamera(video) {
        const ctx = this.cameraCtx;
        const w = this.cameraCanvas.width;
        const h = this.cameraCanvas.height;

        // Horizontal spiegeln (Spiegel-Effekt wie cv2.flip)
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
    }

    /**
     * Zeichnet das HUD (Head-Up Display).
     * @param {string} color - Aktuelle Zeichenfarbe (hex)
     * @param {number} thickness - Aktuelle Strichdicke
     * @param {string} mode - Aktueller Modus
     * @param {number} fps - Aktuelle FPS
     */
    renderHUD(color, thickness, mode, fps) {
        const ctx = this.hudCtx;
        const w = this.hudCanvas.width;
        const h = this.hudCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // --- HUD-Hintergrund oben links ---
        ctx.fillStyle = 'rgba(20, 20, 30, 0.75)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 270, 130, 12);
        ctx.fill();

        // Rahmen mit Glow
        ctx.strokeStyle = 'rgba(100, 100, 140, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(10, 10, 270, 130, 12);
        ctx.stroke();

        // Modus-Anzeige
        const modeColor = MODE_COLORS[mode] || '#FFFFFF';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = modeColor;
        ctx.fillText(`Modus: ${mode}`, 22, 40);

        // Farb-Indikator
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#C8C8C8';
        ctx.fillText('Farbe:', 22, 65);

        // Farbquadrat
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(90, 51, 40, 20, 4);
        ctx.fill();
        ctx.strokeStyle = '#C8C8C8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(90, 51, 40, 20, 4);
        ctx.stroke();

        // Dicke-Anzeige
        ctx.fillStyle = '#C8C8C8';
        ctx.fillText(`Dicke: ${thickness}px`, 22, 92);

        // Dicke-Balken
        const barStart = 140;
        const barEnd = barStart + Math.round((thickness / 30) * 120);
        ctx.fillStyle = '#3C3C3C';
        ctx.beginPath();
        ctx.roundRect(barStart, 80, 120, 15, 4);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(barStart, 80, barEnd - barStart, 15, 4);
        ctx.fill();

        // FPS
        ctx.fillStyle = '#C8C8C8';
        ctx.fillText(`FPS: ${Math.round(fps)}`, 22, 125);

        // --- Virtueller Slider ---
        const sliderX = 20;
        const sliderY = 160;
        const sliderW = 40;
        const sliderH = 300;

        // Hintergrund
        ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY, sliderW, sliderH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY, sliderW, sliderH, 8);
        ctx.stroke();

        // Slider-Spur (dünne Linie in der Mitte)
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sliderX + sliderW / 2, sliderY + 10);
        ctx.lineTo(sliderX + sliderW / 2, sliderY + sliderH - 10);
        ctx.stroke();

        // Thumb-Position berechnen
        const ratio = (30 - thickness) / 28.0;
        const thumbY = sliderY + Math.round(ratio * sliderH);
        const thumbRadius = Math.max(5, Math.floor(thickness / 2)) + 5;

        // Thumb mit Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sliderX + sliderW / 2, thumbY, thumbRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sliderX + sliderW / 2, thumbY, thumbRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#C8C8C8';
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Dicke', sliderX - 3, sliderY - 10);

        // --- Steuerungshinweise (unten) ---
        ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        const helpText = 'Zeigefinger = Zeichnen  |  Alle Finger = Radieren  |  Kleiner Finger = Farbe  |  C = Löschen';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        const helpWidth = ctx.measureText(helpText).width + 20;
        ctx.beginPath();
        ctx.roundRect((w - helpWidth) / 2, h - 38, helpWidth, 28, 8);
        ctx.fill();

        ctx.fillStyle = '#969696';
        ctx.textAlign = 'center';
        ctx.fillText(helpText, w / 2, h - 20);
        ctx.textAlign = 'left';
    }
}
