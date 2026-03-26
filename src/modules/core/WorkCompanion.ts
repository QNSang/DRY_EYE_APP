import { EventEmitter } from '../utils/EventEmitter';
import { ContextDetector } from './ContextDetector';
import { ConsentManager } from './ConsentManager';
import { NotificationService } from '../pomodoro/NotificationService';
import { PolicyEngine } from '../pomodoro/PolicyEngine';
import { CameraController } from '../camera/CameraController';
import { PomodoroTimer } from '../pomodoro/PomodoroTimer';
import { ScoreCalculator } from './ScoreCalculator';
import { GamificationService } from '../../services/GamificationService';

interface CompanionDependencies {
    cameraController: CameraController;
    policyEngine: PolicyEngine;
    notificationService: NotificationService;
    consentManager: ConsentManager;
    gamificationService: GamificationService;
}

export interface WorkCompanionStats {
    sessionCount: number;
    autoResets: number;
    violations: number;
    totalChecks: number;
    lowQualitySamples: number;
    blinkRates: number[];
    incompleteBlinkRatios: number[];
    vitalityBonuses: number;
    hasProtection: boolean;
    lastVitalityCheckTime: number;
    events: string[];
    verifyScheduled: boolean;
}

/**
 * WorkCompanion
 * The "Orchestrator" for Mode B: Work Support.
 */
export class WorkCompanion extends EventEmitter {
    camera: CameraController;
    policy: PolicyEngine;
    notifier: NotificationService;
    consent: ConsentManager;
    contextDetector: ContextDetector;
    timer: PomodoroTimer;
    gamification: GamificationService;

    state: string = 'IDLE';
    stats: WorkCompanionStats;

    constructor(dependencies: CompanionDependencies) {
        super();
        this.camera = dependencies.cameraController;
        this.policy = dependencies.policyEngine;
        this.notifier = dependencies.notificationService;
        this.consent = dependencies.consentManager;
        this.gamification = dependencies.gamificationService;

        this.contextDetector = new ContextDetector();

        // Initialize Pomodoro Timer
        this.timer = new PomodoroTimer(this.policy, this.notifier);
        this.timer.init();

        this.stats = {
            sessionCount: 0,
            autoResets: 0,
            violations: 0,
            totalChecks: 0,
            lowQualitySamples: 0,
            blinkRates: [],
            incompleteBlinkRatios: [],
            vitalityBonuses: 0,
            hasProtection: false,
            lastVitalityCheckTime: Date.now(),
            events: [],
            verifyScheduled: false
        };

        this._setupEventListeners();
    }

    private _setupEventListeners() {
        // Listen to Timer Ticks for Pulse Sampling
        this.timer.on('camera_check_required', () => {
            if (this.consent.can('camera_usage')) {
                this._performPulseCheck();
            }
        });

        this.timer.on('update', (data: any) => {
            this.emit('tick', data);
        });

        this.timer.on('status_change', (data: any) => {
            this.state = data.status;
            this.emit('status_change', data);
        });

        this.timer.on('warmup_start', () => {
            this._performWarmupCheck();
        });

        this.timer.on('summary_required', () => {
            this._handleSessionSummary();
        });

        // Listen for Snooze from UI
        this.notifier.on('snooze', () => {
            console.log('[Companion] Snooze requested. Pausing session.');
            this.pauseSession();
            this.emit('status_change', { status: 'PAUSED' });
        });
    }

    private async _performWarmupCheck() {
        console.log('[Companion] Warming up camera...');
        await this.camera.start(undefined, true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const metrics = await this.camera.getSnapshotMetrics();
        if (metrics && metrics.distance > 0) {
            console.log('[Companion] Warmup success. User present.');
        }
        await this.camera.stop();
    }

    /**
     * Start/Resume a Work Session
     */
    async startSession() {
        if (!this.consent.can('notifications')) {
            console.warn('Notifications not allowed.');
        }

        this.timer.start();
        if (this.timer.status === 'BREAK') {
            this.state = 'BREAK';
        } else {
            this.state = 'WORKING';
            this._performPulseCheck(); // Immediate check
        }
        this.emit('session_started', {});
    }

    pauseSession() {
        this.timer.pause();
    }

    resetSession() {
        this.timer.resetToFull();
    }

    stopSession() {
        // Trigger summary before stopping if we were in a session
        if (this.state !== 'IDLE') {
            this._handleSessionSummary();
        }

        this.timer.stop();
        this.state = 'IDLE';
        this.emit('session_stopped', {});
    }

    /**
     * Pulse Check (3-5s Measurement)
     * Core smart feature: Mở cam chớp nhoáng -> Phân tích -> Tắt cam
     */
    private async _performPulseCheck() {
        // 1. Context Awareness: Skip if in Meeting/Deep Work
        const contextStatus = this.contextDetector.shouldSkipCheck();
        if (contextStatus.skip) {
            console.log(`[Companion] Skipping check: ${contextStatus.reason}`);
            return;
        }

        console.log('[Companion] Starting Pulse Check (5s)...');

        try {
            // 2. Silent Camera Start (hidden)
            try {
                await this.camera.start(undefined, true);
            } catch (cameraError: any) {
                // Check if camera is busy with another app (Zoom, Teams, etc.)
                const isBusy =
                    cameraError?.message?.includes('NotReadableError') ||
                    cameraError?.message?.includes('TrackStartError') ||
                    cameraError?.name === 'NotReadableError';

                if (isBusy) {
                    this.contextDetector.reportCameraBusy();
                    this.emit('nudge', {
                        type: 'CONTEXT_SKIP',
                        message: 'Phát hiện Camera đang bận (có thể do bạn đang họp). Đã tạm dừng kiểm tra.'
                    });
                }
                throw cameraError; // Rethrow for outer catch
            }

            // 3. Monitor in real-time for 5 seconds to make it responsive
            let capturedSnapshot: any = null;
            let nearCount = 0; // Smart Patience counter
            const checkStart = Date.now();

            const monitorPulse = async () => {
                if (Date.now() - checkStart >= 5000) return;

                const current = await this.camera.getSnapshotMetrics();
                if (current.distance > 0) {
                    capturedSnapshot = current;
                    this.emit('metrics_update', { distance: current.distance });

                    // Smart Patience: Only nudge and penalize if they STAY near for 3 checks (~1.5 second)
                    if (current.distance < 45) { // Updated to 45cm for better safety margin
                        nearCount++;
                        if (nearCount === 3) { // 3rd check confirmed at 1.5s mark!
                            console.log('[Companion] Proximity violation confirmed at 1.5s mark.');

                            // 1. Record Violation (NEAR_EVENT_CONFIRMED) -> Deducts 5 points in ScoreCalculator
                            this.stats.events.push('NEAR_EVENT_CONFIRMED');
                            this.stats.violations++;
                            this.gamification.recordViolation();

                            // 2. Notify (Triggers RED Edge Lighting via 'Nhắc Nhở' title)
                            this.notifier.notify('Nhắc Nhở ⚠️', "Bạn đang ngồi quá gần! Hãy lùi ra xa để bảo vệ mắt nhé.", {
                                sound: true,
                                priority: true
                            });

                            this.emit('nudge', { type: 'WARNING', message: "Ngồi quá gần màn hình!" });
                        }
                    } else {
                        // User self-corrected before the 3rd check!
                        if (nearCount > 0) {
                            console.log('[Companion] User self-corrected posture before punishment.');
                            this.stats.events.push('NEAR_EVENT_SELF_CORRECTED'); // Deducts 0 points now
                        }
                        nearCount = 0; // Reset patience
                    }
                }

                if (Date.now() - checkStart < 5000) {
                    setTimeout(monitorPulse, 500);
                }
            };

            monitorPulse();

            // wait for the full duration
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 4. Final Capture
            const snapshot = await this.camera.getSnapshotMetrics();

            // 5. STOP CAMERA IMMEDIATELY 
            await this.camera.stop();

            if (!snapshot || snapshot.distance === 0) {
                // If we didn't get a final one, try the last good one from the stream
                if (capturedSnapshot) {
                    this._processSnapshot(capturedSnapshot);
                } else {
                    this._handleUserAbsence();
                }
                return;
            }

            this._processSnapshot(snapshot);

        } catch (e) {
            console.error('[Companion] Pulse Check failed', e);
            await this.camera.stop(); // Ensure safety
        }
    }

    private _processSnapshot(snapshot: any) {
        // Post-Check Orchestration
        this.stats.totalChecks++;
        const presenceOk = snapshot.distance > 0;
        this.policy.updateAdaptiveInterval(snapshot, presenceOk);

        // Record metrics for Score calculation (Fatigue/Blinks)
        if (snapshot.quality === 'OK') {
            this.stats.blinkRates.push(snapshot.blinkRate);
            this.stats.incompleteBlinkRatios.push(snapshot.incompleteBlinkRatio);
        }

        const avgIncomplete = this.stats.incompleteBlinkRatios.length > 0
            ? this.stats.incompleteBlinkRatios.reduce((a, b) => a + b, 0) / this.stats.incompleteBlinkRatios.length
            : 0;

        const currentScore = ScoreCalculator.calculate({
            events: this.stats.events,
            incompleteBlinkRatio: avgIncomplete,
            isCompleted: false,
            vitalityBonuses: this.stats.vitalityBonuses,
            hasProtection: this.stats.hasProtection
        });

        // Adaptive 20-20-20 Rule (Requires currentScore)
        const now = Date.now();
        const timeSinceLastBreak = now - this.stats.lastVitalityCheckTime;
        const TWENTY_MINS = 20 * 60 * 1000;
        const FORTY_MINS = 40 * 60 * 1000;

        if (timeSinceLastBreak >= TWENTY_MINS) {
            if (timeSinceLastBreak >= FORTY_MINS) {
                console.log('[Companion] 40min Hard Cap reached. Forcing break.');
                this._triggerVitalityBreak();
            } else if (currentScore < 80) {
                console.log(`[Companion] Score ${currentScore} < 80 after 20m. Suggesting break.`);
                this._triggerVitalityBreak();
            } else {
                console.log(`[Companion] Score ${currentScore} >= 80. Skipping 20m break to maintain flow.`);
            }
        }

        this.emit('metrics_update', {
            distance: snapshot.distance,
            score: currentScore
        });
    }

    private _handleUserAbsence() {
        console.log('[Companion] No user detected. Auto-resetting session timer.');
        this.stats.autoResets++;

        // Stop the session since the user is not present
        this.timer.stop();

        this.notifier.notify('Phiên làm việc tạm dừng', 'Hệ thống đã dừng đồng hồ vì không thấy bạn ở trước màn hình. Hãy nhấn Start khi bạn quay lại nhé!', {
            sound: false
        });

        this.emit('auto_reset', { reason: 'user_absent' });
    }

    setMode(modeId: string) {
        this.policy.setMode(modeId);
        this.timer.init(); // Refresh config from storage/mode
    }

    private _handleSessionSummary() {
        const avgBlinkRate = this.stats.blinkRates.length > 0
            ? this.stats.blinkRates.reduce((a, b) => a + b, 0) / this.stats.blinkRates.length
            : 0;

        const avgIncompleteBlinkRatio = this.stats.incompleteBlinkRatios.length > 0
            ? this.stats.incompleteBlinkRatios.reduce((a, b) => a + b, 0) / this.stats.incompleteBlinkRatios.length
            : 0.2; // Default baseline

        const score = ScoreCalculator.calculate({
            events: this.stats.events,
            incompleteBlinkRatio: avgIncompleteBlinkRatio,
            isCompleted: true,
            vitalityBonuses: this.stats.vitalityBonuses,
            hasProtection: this.stats.hasProtection
        });

        const reasons: string[] = [];
        if (this.stats.events.filter(e => e === 'NEAR_EVENT_CONFIRMED').length > 2) {
            reasons.push("Ngồi quá gần thường xuyên");
        }

        const summary = {
            score: score,
            violations: this.stats.violations,
            avgBlinkRate: avgBlinkRate,
            severity: ScoreCalculator.getSeverity(score),
            reasons: reasons.slice(0, 3)
        };

        console.log('[Companion] Session Summary:', summary);
        this.emit('summary_ready', summary);
    }

    private _triggerVitalityBreak() {
        console.log('[Companion] 20-20-20 Triggered (Nudge Only)');
        this.stats.lastVitalityCheckTime = Date.now();

        // Step 1: Start Break Notice + Edge Lighting
        this.notifier.notify('Nạp năng lượng cho mắt 🌿', 'Đã đến lúc nghỉ ngơi, hãy nhìn ra xa 6m trong vòng 5 giây nhé!', {
            sound: true,
            priority: true
        });

        this.emit('vitality_nudge', {}); // Trigger Blue Edge Lighting Pulse
    }
}
