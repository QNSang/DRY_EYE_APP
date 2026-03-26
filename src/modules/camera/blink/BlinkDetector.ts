/**
 * Blink Detector
 * Deterministic blink detection with state machine, hysteresis, and incomplete blink detection
 * 
 * Features:
 * - State machine: OPEN → CLOSING → CLOSED → OPENING → OPEN
 * - EAR (Eye Aspect Ratio) calculation from MediaPipe landmarks
 * - Baseline calibration for incomplete blink detection
 * - Temporal smoothing (EMA/median) to reduce noise
 * - Debouncing to eliminate false positives
 * - Duration validation (80-400ms)
 * - Configurable thresholds
 */

import type { BlinkMetrics, BlinkEvent, EyeOpenness, BlinkDetectorConfig } from '../types'
import { calculateEAR } from '../LandmarkProvider'

enum BlinkState {
    OPEN = 'OPEN',
    CLOSING = 'CLOSING',
    CLOSED = 'CLOSED',
    OPENING = 'OPENING'
}

const DEFAULT_CONFIG: BlinkDetectorConfig = {
    earThreshold: 0.22, // Slightly more lenient to hit the "closed" state
    earCloseThreshold: 0.26, // Increased from 0.25
    earOpenThreshold: 0.29, // Increased from 0.28
    incompleteThreshold: 0.50, // Loosened for reading (looking down) conditions
    minBlinkDuration: 50, // Reduced from 80ms to catch faster blinks
    maxBlinkDuration: 550, // Increased from 400ms to catch slower blinks
    debounceTime: 80, // Reduced from 120ms to catch rapid blinks
    smoothingWindowSize: 3 // frames
}

export class BlinkDetector {
    private config: BlinkDetectorConfig
    private state: BlinkState = BlinkState.OPEN
    private blinkHistory: BlinkEvent[] = []
    private opennessHistory: EyeOpenness[] = []
    private smoothingWindow: number[] = []
    private monitoringStartTime: number = 0

    // Baseline openness (calculated from stable OPEN state frames)
    private baselineOpenness: number = 0.30 // Reduced from 0.35 default for more conservative start

    // Current blink tracking
    private currentBlinkStart: number = 0
    private currentBlinkMinOpenness: number = 1.0
    private lastBlinkTimestamp: number = 0

    // Calibration
    private isCalibrated: boolean = false
    private calibrationSamples: number[] = []

    // Public metric for real-time HUD
    public currentEAR: number = 0

    constructor(config: Partial<BlinkDetectorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
    }

    /**
     * Process eye landmarks and detect blinks
     * Returns current eye openness for tracking
     */
    processFrame(
        eyeLandmarks: {
            left: Array<{ x: number; y: number; z?: number }>
            right: Array<{ x: number; y: number; z?: number }>
        } | null,
        timestamp: number
    ): EyeOpenness | null {
        if (!eyeLandmarks) {
            this.currentEAR = 0
            return null
        }

        // Calculate EAR for both eyes
        const leftEAR = calculateEAR(eyeLandmarks.left)
        const rightEAR = calculateEAR(eyeLandmarks.right)

        // Average EAR
        const rawOpenness = (leftEAR + rightEAR) / 2
        this.currentEAR = rawOpenness // Set for HUD

        // Apply temporal smoothing to raw EAR
        const smoothedRawEAR = this.smoothOpenness(rawOpenness)

        const normalizedOpenness = Math.min(1.2, rawOpenness / this.baselineOpenness)

        const eyeOpenness: EyeOpenness = {
            left: leftEAR / this.baselineOpenness,
            right: rightEAR / this.baselineOpenness,
            timestamp
        }

        this.opennessHistory.push(eyeOpenness)

        // Keep only last 60 seconds of history
        const sixtySecondsAgo = timestamp - 60000
        this.opennessHistory = this.opennessHistory.filter((h) => h.timestamp > sixtySecondsAgo)

        // Calibrate baseline if needed or update it slowly
        this.calibrateBaseline(smoothedRawEAR)

        // Run state machine using smoothed raw EAR
        this.updateStateMachine(smoothedRawEAR, timestamp)

        return eyeOpenness
    }

    /**
     * Smooth openness using median window
     */
    private smoothOpenness(openness: number): number {
        this.smoothingWindow.push(openness)

        if (this.smoothingWindow.length > this.config.smoothingWindowSize) {
            this.smoothingWindow.shift()
        }

        // Return median of window
        const sorted = [...this.smoothingWindow].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted[mid]
    }

    /**
     * Calibrate baseline openness from stable OPEN frames
     */
    private calibrateBaseline(openness: number): void {
        // Collect samples when eyes appear open (openness > 0.15)
        // Note: Lowered from 0.25 to 0.15 to support users with very narrow eyes
        if (openness > 0.15) {
            this.calibrationSamples.push(openness)
        }

        // After 30 samples, calculate baseline as median
        if (this.calibrationSamples.length >= 30) {
            const sorted = [...this.calibrationSamples].sort((a, b) => a - b)
            const mid = Math.floor(sorted.length / 2)
            this.baselineOpenness = sorted[mid]
            this.isCalibrated = true
            console.log('[BlinkDetector] Baseline calibrated:', this.baselineOpenness.toFixed(3))
        }
    }

    /**
     * State machine for blink detection with adaptive thresholds
     */
    private updateStateMachine(rawEAR: number, timestamp: number): void {
        // Compute dynamic thresholds based on baseline
        // Start closing at 93% of baseline (extremely sensitive)
        const closeThreshold = this.baselineOpenness * 0.93
        // Confirm blink at 82% of baseline (only 18% closure needed) - catch shallow blinks
        const confirmedThreshold = this.baselineOpenness * 0.82
        // Return to open at 97% of baseline
        const openThreshold = this.baselineOpenness * 0.97

        switch (this.state) {
            case BlinkState.OPEN:
                if (rawEAR < closeThreshold) {
                    this.state = BlinkState.CLOSING
                    this.currentBlinkStart = timestamp
                    this.currentBlinkMinOpenness = rawEAR / this.baselineOpenness
                }
                break

            case BlinkState.CLOSING:
                // Track minimum openness (normalized)
                const currentNorm = rawEAR / this.baselineOpenness
                if (currentNorm < this.currentBlinkMinOpenness) {
                    this.currentBlinkMinOpenness = currentNorm
                }

                // Transition to CLOSED if below threshold
                if (rawEAR < confirmedThreshold) {
                    this.state = BlinkState.CLOSED
                }

                // Abort if eyes reopen without reaching CLOSED
                if (rawEAR > openThreshold) {
                    this.state = BlinkState.OPEN
                }
                break

            case BlinkState.CLOSED:
                // Track minimum openness
                const currentNorm2 = rawEAR / this.baselineOpenness
                if (currentNorm2 < this.currentBlinkMinOpenness) {
                    this.currentBlinkMinOpenness = currentNorm2
                }

                // Transition to OPENING when eyes start to reopen
                if (rawEAR >= confirmedThreshold) {
                    this.state = BlinkState.OPENING
                }
                break

            case BlinkState.OPENING:
                // Track minimum openness
                const currentNorm3 = rawEAR / this.baselineOpenness
                if (currentNorm3 < this.currentBlinkMinOpenness) {
                    this.currentBlinkMinOpenness = currentNorm3
                }

                // Complete blink when fully open
                if (rawEAR >= openThreshold) {
                    this.completeBlink(timestamp)
                    this.state = BlinkState.OPEN
                }
                break
        }
    }

    /**
     * Complete a blink and validate it
     */
    private completeBlink(timestamp: number): void {
        const duration = timestamp - this.currentBlinkStart

        // Validate duration
        if (duration < this.config.minBlinkDuration || duration > this.config.maxBlinkDuration) {
            console.log('[BlinkDetector] Invalid blink duration:', duration)
            return
        }

        // Debounce: ignore if too close to last blink
        if (timestamp - this.lastBlinkTimestamp < this.config.debounceTime) {
            console.log('[BlinkDetector] Debounced blink')
            return
        }

        // Determine if incomplete (currentBlinkMinOpenness is already normalized 0-1)
        const isComplete =
            this.currentBlinkMinOpenness <= this.config.incompleteThreshold

        // Record blink
        const blinkEvent: BlinkEvent = {
            timestamp,
            isComplete,
            minOpenness: this.currentBlinkMinOpenness,
            duration
        }

        this.blinkHistory.push(blinkEvent)
        this.lastBlinkTimestamp = timestamp

        console.log('[BlinkDetector] Blink detected:', {
            isComplete,
            duration,
            minOpenness: this.currentBlinkMinOpenness.toFixed(2),
            ratio: (this.currentBlinkMinOpenness / this.baselineOpenness).toFixed(2)
        })

        // Keep only last 60 seconds
        const sixtySecondsAgo = timestamp - 60000
        this.blinkHistory = this.blinkHistory.filter((b) => b.timestamp > sixtySecondsAgo)
    }

    /**
     * Calculate metrics for a given duration
     */
    calculateMetrics(durationSeconds: number, avgFps: number): BlinkMetrics {
        if (this.blinkHistory.length === 0) {
            return {
                blinkCount: 0,
                blinkRate: 0,
                incompleteBlinkCount: 0,
                incompleteBlinkRatio: 0,
                confidence: 0
            }
        }

        const blinkCount = this.blinkHistory.length
        const incompleteBlinkCount = this.blinkHistory.filter((b) => !b.isComplete).length

        // Blink rate: blinks per minute
        const minutes = durationSeconds / 60
        const blinkRate = minutes > 0 ? blinkCount / minutes : 0

        // Incomplete blink ratio
        const incompleteBlinkRatio = blinkCount > 0 ? incompleteBlinkCount / blinkCount : 0

        // Confidence calculation
        let confidence = 1.0

        // Reduce confidence if FPS is low
        if (avgFps < 20) {
            confidence *= 0.7
        } else if (avgFps < 24) {
            confidence *= 0.85
        }

        // Reduce confidence if not calibrated
        if (!this.isCalibrated) {
            confidence *= 0.5
        }

        // Reduce confidence for incomplete blink detection specifically if FPS < 30
        if (avgFps < 30) {
            // Incomplete blink detection needs high FPS to catch nadir
            confidence *= 0.8
        }

        return {
            blinkCount,
            blinkRate: Math.round(blinkRate * 10) / 10,
            incompleteBlinkCount,
            incompleteBlinkRatio: Math.round(incompleteBlinkRatio * 100) / 100,
            confidence: Math.round(confidence * 100) / 100
        }
    }

    /**
     * Get blink history
     */
    getBlinkHistory(): BlinkEvent[] {
        return [...this.blinkHistory]
    }

    /**
     * Reset detector state
     */
    reset(): void {
        this.state = BlinkState.OPEN
        this.blinkHistory = []
        this.opennessHistory = []
        this.smoothingWindow = []
        this.currentBlinkStart = 0
        this.currentBlinkMinOpenness = 1.0
        this.lastBlinkTimestamp = 0
        this.isCalibrated = false
        this.calibrationSamples = []
        this.monitoringStartTime = Date.now()
    }

    /**
     * Get real-time metrics
     */
    getMetrics(): BlinkMetrics {
        const now = Date.now()
        // Duration is either time since start or 60s window
        const durationMs = Math.max(1000, now - this.monitoringStartTime)
        const durationSec = Math.min(60, durationMs / 1000)

        const metrics = this.calculateMetrics(durationSec, 30)
        return {
            ...metrics,
            currentEAR: this.currentEAR
        }
    }

    /**
     * Check if calibrated
     */
    isReady(): boolean {
        return this.isCalibrated
    }
}
