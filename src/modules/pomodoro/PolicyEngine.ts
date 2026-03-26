import { WORK_MODES, DEFAULT_MODE, WorkMode } from '../core/WorkConfiguration';
import { EscalationManager } from '../core/EscalationManager';

export interface CameraResult {
    bucket: 'NEAR' | 'OK' | 'FAR' | 'UNKNOWN';
    quality: 'OK' | 'DEGRADED';
    estimatedDistanceCm: number;
}

export class PolicyEngine {
    currentMode: WorkMode;
    escalationManager: EscalationManager;
    sessionStats: {
        checks: number;
        violations: number;
        consecutiveOkPulses: number;
    };
    nextCheckInterval: number;

    constructor() {
        this.currentMode = DEFAULT_MODE;
        this.escalationManager = new EscalationManager();
        this.sessionStats = {
            checks: 0,
            violations: 0,
            consecutiveOkPulses: 0
        };
        this.nextCheckInterval = this.currentMode.checkIntervalSec;
    }

    setMode(modeId: string) {
        // @ts-ignore
        const mode = Object.values(WORK_MODES).find((m: any) => m.id === modeId);
        if (mode) {
            this.currentMode = mode;
            this.nextCheckInterval = mode.checkIntervalSec;
            console.log(`[Policy] Switched to mode: ${mode.label}`);
        }
    }

    /**
     * Determines if a mid-session check should occur.
     * Supports Adaptive Frequency v3.
     */
    shouldTriggerMidCheck(elapsedSec: number, totalDurationSec: number, lastCheckTimeSec: number) {
        // Clamp and return
        const timeSinceLast = elapsedSec - (lastCheckTimeSec || 0);
        return timeSinceLast >= this.nextCheckInterval;
    }

    /**
     * Updates the next check interval based on behavior (Adaptive v3)
     */
    updateAdaptiveInterval(cameraResult: any, presenceOk: boolean) {
        if (!this.currentMode.adaptive || cameraResult.quality !== 'OK') {
            return;
        }

        const isOk = cameraResult.bucket === 'OK' && presenceOk;
        const step = this.currentMode.adaptiveStep;

        if (isOk) {
            this.sessionStats.consecutiveOkPulses = (this.sessionStats.consecutiveOkPulses || 0) + 1;
            if (this.sessionStats.consecutiveOkPulses >= 2) {
                // Extend interval
                this.nextCheckInterval = Math.min(
                    this.nextCheckInterval * (1 + step),
                    this.currentMode.maxIntervalSec
                );
            }
        } else {
            this.sessionStats.consecutiveOkPulses = 0;
            if (cameraResult.bucket === 'NEAR') {
                // Shorten interval
                this.nextCheckInterval = Math.max(
                    this.nextCheckInterval * (1 - step),
                    this.currentMode.minIntervalSec
                );
            }
        }

        console.log(`[Policy] New Adaptive Interval: ${Math.round(this.nextCheckInterval / 60)}m`);
    }

    /**
     * Decisions based on Camera Result
     */
    evaluateMidCheckResult(cameraResult: any) {
        this.sessionStats.checks++;

        const isViolation = cameraResult.bucket === 'NEAR';
        if (isViolation) this.sessionStats.violations++;

        // 1. Silent Success Rule
        if (!isViolation && this.currentMode.silentSuccess) {
            this.escalationManager.evaluate(false); // Log good behavior
            return { action: 'NONE', message: '' };
        }

        // 2. Escalation Logic
        const intervention = this.escalationManager.evaluate(isViolation);

        if (intervention.actionType === 'NONE') return { action: 'NONE' };

        // Construct Message (Companion Tone)
        let message = "Cố gắng lùi xa một chút nhé, bạn đang tập trung rất tốt! ✨";
        if (cameraResult.estimatedDistanceCm < 40) {
            message = "Mắt bạn hơi căng rồi, lùi ra một chút cho dễ chịu nha. 🌿";
        }

        return {
            action: intervention.actionType, // MICRO_NUDGE, TOAST, WARNING, ALERT
            message: message,
            sound: intervention.sound,
            modal: intervention.modal,
            level: intervention.level
        };
    }

    evaluateBreakStart(sessionStats: any) {
        // End of session break advice
        let msg = "Phiên này làm tốt đó! Nghỉ ngơi một chút rồi quay lại nha. 🔋";
        if (sessionStats.blinkRate < 10) {
            msg = "Mắt bạn có vẻ hơi mỏi. Hãy nhắm mắt thư giãn 20 giây nhé! 🌿";
        }

        return {
            action: 'NOTIFY',
            message: msg,
            sound: !this.currentMode.silentMode
        };
    }

    _calculateCompliance() {
        if (this.sessionStats.checks === 0) return 1.0;
        return 1.0 - (this.sessionStats.violations / this.sessionStats.checks);
    }
}
