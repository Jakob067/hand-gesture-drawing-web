/**
 * Gesture Drawing – Hauptprogramm (Web-Version)
 * Gestengesteuerte Zeichenanwendung mit MediaPipe Hands.
 * Portiert von main.py
 *
 * Steuerung:
 *   - Zeigefinger hoch: Zeichnen
 *   - Alle Finger hoch (offene Handfläche): Radieren
 *   - Kleiner Finger hoch: Farbe wechseln
 *   - Zeigefinger + Slider links: Strichdicke ändern
 *   - 'c': Canvas löschen
 */

import { HandTracker } from './handTracker.js';
import { estimateFingerStates } from './fingerState.js';
import { GestureClassifier } from './gestureClassifier.js';
import { DrawingEngine } from './drawingEngine.js';
import { Renderer } from './renderer.js';

class App {
    constructor() {
        // DOM-Elemente
        this.video = document.getElementById('video');
        this.cameraCanvas = document.getElementById('cameraCanvas');
        this.drawCanvas = document.getElementById('drawCanvas');
        this.hudCanvas = document.getElementById('hudCanvas');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingStatus = document.getElementById('loadingStatus');

        // Module
        this.tracker = new HandTracker(this.video);
        this.classifier = new GestureClassifier();
        this.engine = null; // wird nach Kamera-Init erstellt
        this.renderer = null;

        // FPS-Tracking
        this.prevTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = performance.now();

        // Aktuellste Landmarks
        this.currentLandmarks = null;

        // Lauf-Status
        this.running = false;
    }

    /**
     * Startet die Anwendung.
     */
    async start() {
        try {
            this.loadingStatus.textContent = 'Kamera wird gestartet...';

            // Tracker initialisieren (startet Kamera + MediaPipe)
            await this.tracker.init((landmarks, results) => {
                this.currentLandmarks = landmarks;
            });

            this.loadingStatus.textContent = 'MediaPipe wird geladen...';

            // Canvas-Größe an Video anpassen
            const width = this.tracker.width;
            const height = this.tracker.height;

            this.cameraCanvas.width = width;
            this.cameraCanvas.height = height;
            this.drawCanvas.width = width;
            this.drawCanvas.height = height;
            this.hudCanvas.width = width;
            this.hudCanvas.height = height;

            // Module erstellen
            this.engine = new DrawingEngine(this.drawCanvas);
            this.renderer = new Renderer(this.cameraCanvas, this.hudCanvas);

            // Lade-Overlay ausblenden
            this.loadingOverlay.classList.add('hidden');

            // Tastatur-Events
            document.addEventListener('keydown', (e) => this._handleKey(e));

            // Main-Loop starten
            this.running = true;
            this._loop();

            console.log('=== Gesture Drawing Web gestartet ===');
        } catch (error) {
            this.loadingStatus.textContent = `Fehler: ${error.message}`;
            console.error('Initialisierungsfehler:', error);
        }
    }

    /**
     * Haupt-Renderloop.
     */
    async _loop() {
        if (!this.running) return;

        // 1. FPS berechnen
        this.frameCount++;
        const now = performance.now();
        if (now - this.fpsUpdateTime >= 500) {
            this.fps = (this.frameCount / ((now - this.fpsUpdateTime) / 1000));
            this.frameCount = 0;
            this.fpsUpdateTime = now;
        }

        // 2. Frame an MediaPipe senden
        await this.tracker.processFrame();

        // 3. Kamerabild rendern (gespiegelt)
        this.renderer.renderCamera(this.video);

        // 4. Landmarks auf Kamerabild zeichnen
        const landmarks = this.currentLandmarks;
        this.tracker.drawLandmarks(this.cameraCtx, landmarks);

        // 5. Fingerzustand bestimmen
        const fingers = estimateFingerStates(
            landmarks, this.drawCanvas.width, this.drawCanvas.height
        );

        // 6. Fingertip-Position (Index = Landmark 8)
        let fingertip = null;
        let indexY = null;
        if (landmarks && landmarks.length > 8) {
            fingertip = {
                x: landmarks[8].x * this.drawCanvas.width,
                y: landmarks[8].y * this.drawCanvas.height
            };
            indexY = fingertip.y;
        }

        // 7. Geste klassifizieren
        const [gesture] = this.classifier.classify(fingers, indexY);

        // 8. Aktion ausführen
        this.engine.execute(gesture, fingertip, landmarks);

        // 9. HUD rendern
        this.renderer.renderHUD(
            this.engine.color, this.engine.thickness,
            this.engine.mode, this.fps
        );

        // Nächster Frame
        requestAnimationFrame(() => this._loop());
    }

    /**
     * Getter für Camera-Canvas-Kontext (für Landmarks).
     */
    get cameraCtx() {
        return this.cameraCanvas.getContext('2d');
    }

    /**
     * Tastatureingaben verarbeiten.
     */
    _handleKey(event) {
        const key = event.key.toLowerCase();
        if (key === 'c') {
            this.engine.clearCanvas();
            console.log('Canvas gelöscht.');
        }
    }

    /**
     * Stoppt die Anwendung und gibt Ressourcen frei.
     */
    stop() {
        this.running = false;
        this.tracker.release();
        console.log('Ressourcen freigegeben. Auf Wiedersehen!');
    }
}

// App starten wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window._gestureApp = app; // Für Debugging
    app.start();
});
