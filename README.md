# hand-gesture-drawing-web

Eine gestengesteuerte Zeichenanwendung im Browser, die MediaPipe Hands für Echtzeit-Handtracking nutzt. Zeichne, radiere und wechsle Farben – ganz ohne Maus oder Touchscreen.

---

## Demo

| Geste | Aktion |
|---|---|
| ☝️ Zeigefinger hoch | Zeichnen |
| 🖐️ Alle Finger / offene Hand | Radieren |
| 🤙 Kleiner Finger hoch | Farbe wechseln |
| ☝️ Zeigefinger auf linken Slider | Strichdicke anpassen |
| `C` (Tastatur) | Gesamtes Canvas löschen |

---

## Projektstruktur

```
hand-gesture-drawing-web/
├── index.html            # HTML-Grundgerüst mit drei Canvas-Schichten
├── style.css             # Dark-Theme Styling
├── main.js               # App-Einstiegspunkt und Hauptloop
├── handTracker.js        # Kamera-Zugriff und MediaPipe Hands Integration
├── fingerState.js        # Binäre Fingerzustandserkennung (oben/unten)
├── gestureClassifier.js  # Regelbasierte Gestenklassifikation mit State Machine
├── drawingEngine.js      # Zeichenlogik, Radierer und Farbverwaltung
└── renderer.js           # Kamerabild-Rendering und HUD-Overlay
```

### Modulübersicht

| Modul | Beschreibung |
|---|---|
| `handTracker.js` | Startet die Webcam und verarbeitet Frames mit MediaPipe Hands. Liefert 21 normalisierte Landmark-Punkte pro Hand. |
| `fingerState.js` | Bestimmt für jeden der 5 Finger, ob er gestreckt (1) oder gebeugt (0) ist. Daumen wird per X-Koordinate, alle anderen per Y-Koordinate erkannt. |
| `gestureClassifier.js` | Mappt Fingerzustände auf Systemgesten (DRAW, ERASE, COLOR_SWITCH, IDLE). Temporale Glättung über 3 aufeinanderfolgende Frames verhindert Flackern. |
| `drawingEngine.js` | Führt die Zeichenaktionen auf dem Canvas aus. Verwaltet Farbe, Strichdicke, Radierer (palmbasiert) und den virtuellen Slider. |
| `renderer.js` | Zeichnet das gespiegelte Kamerabild und das HUD-Overlay (Modus, Farbe, Dicke, FPS, Slider). |

---

## Voraussetzungen

- Moderner Browser mit Unterstützung für ES-Module (Chrome, Firefox, Edge)
- Webcam
- Internetverbindung (MediaPipe wird via CDN geladen)

> Kein Build-Schritt nötig. Das Projekt läuft direkt als statische Webseite.

---


### Verfügbare Farben

Definiert in `drawingEngine.js` → `COLOR_PALETTE`:

🔵 Blau · 🔴 Rot · 🟢 Grün · 🟡 Gelb · 🟣 Magenta · 🟠 Orange · ⚪ Weiß

---

## Architektur

```
Webcam
  │
  ▼
HandTracker (MediaPipe)
  │  21 Landmarks
  ▼
FingerState Estimation
  │  [thumb, index, middle, ring, pinky]
  ▼
GestureClassifier (State Machine)
  │  DRAW / ERASE / COLOR_SWITCH / IDLE
  ▼
DrawingEngine
  │  Canvas-Operationen
  ▼
Renderer (HUD + Kamerabild)
```

Die Anwendung nutzt drei übereinanderliegende Canvas-Elemente:

1. **cameraCanvas** – gespiegeltes Webcambild + Landmark-Visualisierung
2. **drawCanvas** – Zeichenfläche (blend mode: `screen`)
3. **hudCanvas** – transparentes HUD-Overlay, kein Pointer-Events

---

## Abhängigkeiten

| Paket | Quelle | Zweck |
|---|---|---|
| [@mediapipe/hands](https://www.npmjs.com/package/@mediapipe/hands) | CDN (jsDelivr) | Hand-Landmark-Erkennung |
| [Inter Font](https://fonts.google.com/specimen/Inter) | Google Fonts CDN | UI-Schrift |

Keine weiteren npm-Abhängigkeiten. Kein Framework.

---

## Browser-Kompatibilität

| Browser | Unterstützt |
|---|---|
| Chrome 90+ | ✅ |
| Edge 90+ | ✅ |
| Firefox 90+ | ✅ |
| Safari 15+ | ✅ |
| Mobile Browser | ⚠️ Eingeschränkt (Kamera-Performance) |

