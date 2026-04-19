/**
 * Modul 1+2 – Camera + Hand Landmark Detection
 * Kamera-Zugriff und MediaPipe Hands Integration.
 * Portiert von camera.py + hand_tracker.py
 */

export class HandTracker {
    /**
     * @param {HTMLVideoElement} videoElement
     * @param {number} width - Gewünschte Kamera-Breite
     * @param {number} height - Gewünschte Kamera-Höhe
     */
    constructor(videoElement, width = 1280, height = 720) {
        this.video = videoElement;
        this.width = width;
        this.height = height;
        this.hands = null;
        this.latestResults = null;
        this.isReady = false;
        this._onResultsCallback = null;
    }

    /**
     * Initialisiert MediaPipe Hands und Kamera.
     * @param {Function} onResults - Callback für Ergebnisse
     */
    async init(onResults) {
        this._onResultsCallback = onResults;

        // MediaPipe Hands konfigurieren
        this.hands = new window.Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        this.hands.onResults((results) => this._handleResults(results));

        // Kamera starten
        await this._startCamera();

        this.isReady = true;
    }

    /**
     * Startet die Webcam.
     */
    async _startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: this.width },
                height: { ideal: this.height },
                facingMode: 'user',
            }
        });

        this.video.srcObject = stream;

        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.play();
                // Tatsächliche Auflösung aktualisieren
                this.width = this.video.videoWidth;
                this.height = this.video.videoHeight;
                resolve();
            };
        });
    }

    /**
     * Verarbeitet MediaPipe-Ergebnisse.
     */
    _handleResults(results) {
        this.latestResults = results;

        let landmarks = null;
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            landmarks = results.multiHandLandmarks[0]; // Nur erste Hand
        }

        if (this._onResultsCallback) {
            this._onResultsCallback(landmarks, results);
        }
    }

    /**
     * Sendet den aktuellen Frame an MediaPipe zur Verarbeitung.
     */
    async processFrame() {
        if (this.hands && this.video.readyState >= 2) {
            await this.hands.send({ image: this.video });
        }
    }

    /**
     * Zeichnet Landmarks auf ein Canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array|null} landmarks - Normalisierte Landmarks
     */
    drawLandmarks(ctx, landmarks) {
        if (!landmarks) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Verbindungen (gleich wie Python)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17],
        ];

        // Linien
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        for (const [start, end] of connections) {
            const x1 = landmarks[start].x * w;
            const y1 = landmarks[start].y * h;
            const x2 = landmarks[end].x * w;
            const y2 = landmarks[end].y * h;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Punkte
        ctx.fillStyle = '#FF0000';
        for (const lm of landmarks) {
            ctx.beginPath();
            ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Stoppt Kamera und gibt Ressourcen frei.
     */
    release() {
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(t => t.stop());
            this.video.srcObject = null;
        }
        if (this.hands) {
            this.hands.close();
        }
    }
}
