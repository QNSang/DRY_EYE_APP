/**
 * Main Camera Controller (Adapter)
 * Adapts the new CameraEngine to the interface expected by DiagnosticFlow
 */

import { CameraEngine } from './CameraEngine'
import { EyeMetrics } from '../../types/camera'
import { FaceMeshDrawer } from './FaceMeshDrawer'

export class CameraController {
    private engine: CameraEngine
    private isInitialized = false
    private meshDrawer: FaceMeshDrawer

    constructor() {
        this.engine = new CameraEngine()
        this.meshDrawer = new FaceMeshDrawer()
    }

    async initialize() {
        if (this.isInitialized) return
        await this.engine.init()
        this.isInitialized = true
    }

    /**
     * Get snapshot metrics for other consumers (e.g. main.ts)
     */
    async getSnapshotMetrics() {
        const metrics = await this.engine.getSnapshotMetrics();
        return metrics;
    }

    /**
     * Measure session (diagnostic flow interface)
     */
    async measureSession(durationSec: number, onProgress: (progress: number, guidance: any) => void): Promise<EyeMetrics> {
        if (!this.isInitialized) await this.initialize()

        // 1. Find video element
        const videoElement = document.getElementById('assessment-video') as HTMLVideoElement
        if (!videoElement) {
            throw new Error('Video element #assessment-video not found')
        }

        const canvas = document.getElementById('assessment-canvas') as HTMLCanvasElement
        if (canvas) {
            this.meshDrawer.setCanvas(canvas)
            canvas.width = videoElement.videoWidth || 1280
            canvas.height = videoElement.videoHeight || 720
        }

        // 2. Start Preview
        if (!this.engine.isActive()) {
            await this.engine.startPreview(videoElement)
        }

        // 3. Progress listener is now managed globally or passed via start()
        // No duplicate drawing listener needed here to avoid flickering and performance issues.

        // 4. Run Session
        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000
            const progress = Math.min(100, (elapsed / durationSec) * 100)

            const blinkMetrics = this.engine.getBlinkMetrics()
            const debugState = this.engine.getDebugState()

            // Match structure expected by main.ts HUD
            onProgress(progress, {
                distance: { estimatedCm: debugState?.estCm || 0 },
                blink: {
                    blinkCount: blinkMetrics.blinkCount,
                    incompleteBlinkCount: blinkMetrics.incompleteBlinkCount || 0,
                    blinkRate: blinkMetrics.blinkRate || 0,
                    currentEAR: blinkMetrics.currentEAR || 0,
                    confidence: blinkMetrics.confidence,
                    incompleteBlinkRatio: blinkMetrics.incompleteBlinkRatio
                },
                landmarks: null
            })
        }, 100)

        try {
            const result = await this.engine.runAssessmentSession({ durationSec })

            // Map result to EyeMetrics
            const finalResult: EyeMetrics = {
                blinkCount: result.status === "OK" ? result.blinkMetrics.blinkCount : 0,
                blinkRate: result.status === "OK" ? result.blinkMetrics.blinkRate : 0,
                incompleteBlinkCount: result.status === "OK" ? result.blinkMetrics.incompleteBlinkCount : 0,
                incompleteBlinkRatio: result.status === "OK" ? result.blinkMetrics.incompleteBlinkRatio : 0,
                confidence: result.status === "OK" ? result.qualityFlags.confidence : 0
            };
            return finalResult;
        } finally {
            clearInterval(interval)
            await this.engine.stopPreview()
        }
    }

    // Methods for other parts of app (e.g. Pomodoro)
    async start(videoElement?: HTMLVideoElement, silent: boolean = false) {
        if (!this.isInitialized) await this.initialize()

        // Handle optional video element
        let targetElement = videoElement;
        if (!targetElement) {
            // Try finding the default assessment video
            targetElement = document.getElementById('assessment-video') as HTMLVideoElement;

            // If still no element and we need one for the engine, create a hidden one
            if (!targetElement) {
                targetElement = document.createElement('video');
                targetElement.autoplay = true;
                targetElement.muted = true;
                targetElement.style.display = 'none';
                document.body.appendChild(targetElement);
            }
        }

        // Setup mesh drawing if canvas exists
        const canvas = document.getElementById('assessment-canvas') as HTMLCanvasElement;
        if (canvas) {
            this.meshDrawer.setCanvas(canvas);

            // Remove any existing preview listeners to avoid duplicates
            this.engine.getEventEmitter().removeAllListeners('camera:metrics');

            // Persistent listener for the preview duration
            this.engine.getEventEmitter().on('camera:metrics', (metrics) => {
                if (metrics.landmarks && canvas) {
                    if (targetElement && targetElement.videoWidth && (canvas.width !== targetElement.videoWidth || canvas.height !== targetElement.videoHeight)) {
                        canvas.width = targetElement.videoWidth;
                        canvas.height = targetElement.videoHeight;
                        this.meshDrawer.setCanvas(canvas);
                    }
                    // @ts-ignore - landmarks might have optional Z
                    this.meshDrawer.draw(metrics.landmarks.landmarks);
                } else if (canvas) {
                    // Clear canvas if no face
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }

        await this.engine.startPreview(targetElement)
    }

    async stop() {
        this.engine.getEventEmitter().removeAllListeners('camera:metrics');
        await this.engine.stopPreview()
    }
}
