
import { PolicyEngine } from './PolicyEngine';
import { NotificationService } from './NotificationService';

export class PomodoroTimer {
    policy: PolicyEngine;
    notifications: NotificationService;
    config: any;
    STATE: any;
    status: string;
    remainingSec: number;
    completedSessions: number;
    timerInterval: any;
    listeners: Record<string, Function[]>;
    sessionStartTime: number;
    lastCheckTime: number;
    currentTotalSec: number;

    constructor(policyEngine: PolicyEngine, notificationService: NotificationService) {
        this.policy = policyEngine || new PolicyEngine();
        this.notifications = notificationService || new NotificationService();

        // Configuration
        this.config = {
            workDurationSec: 25 * 60, // Default 25m
            breakDurationSec: 5 * 60, // Default 5m
            longBreakDurationSec: 15 * 60,
            sessionsBeforeLongBreak: 4
        };

        // State using simple object instead of enum for JS
        this.STATE = {
            IDLE: 'IDLE',
            WARMUP: 'WARMUP',
            WORK: 'WORK',
            BREAK: 'BREAK',
            SUMMARY: 'SUMMARY'
        };

        this.status = this.STATE.IDLE;
        this.remainingSec = this.config.workDurationSec;
        this.completedSessions = 0;

        this.timerInterval = null;
        this.listeners = {};

        // Tracking for Policies
        this.sessionStartTime = 0;
        this.lastCheckTime = 0;
        this.currentTotalSec = 25 * 60;
    }

    init() {
        // Load config from local storage if available
        const savedWork = localStorage.getItem('work_duration');
        if (savedWork) {
            this.config.workDurationSec = parseInt(savedWork) * 60;
        }

        const savedBreak = localStorage.getItem('break_duration');
        if (savedBreak) {
            this.config.breakDurationSec = parseInt(savedBreak) * 60;
        }

        const savedCycle = localStorage.getItem('sessions_per_cycle');
        if (savedCycle) {
            this.config.sessionsBeforeLongBreak = parseInt(savedCycle);
        }

        if (this.status === this.STATE.IDLE) {
            this.remainingSec = this.config.workDurationSec;
            this.currentTotalSec = this.config.workDurationSec;
        }

        this._emit('update', {
            time: this.formatTime(this.remainingSec),
            status: this.status,
            remainingSec: this.remainingSec,
            totalSec: this.currentTotalSec
        });
    }

    start() {
        if (this.status === this.STATE.IDLE) {
            this._startWarmup();
        } else {
            // Resume
            this._runTimer();
        }
    }

    _startWarmup() {
        this.status = this.STATE.WARMUP;
        this.remainingSec = 5; // 5s warmup
        this.currentTotalSec = 5;
        this._runTimer();
        this._emit('status_change', { status: this.status });
        this._emit('warmup_start', {});
    }

    pause() {
        this._stopTimer();
        this._emit('status_change', { status: 'PAUSED' });
    }

    stop() {
        this._stopTimer();
        this.status = this.STATE.IDLE;
        this.remainingSec = this.config.workDurationSec;
        this.currentTotalSec = this.config.workDurationSec;
        this._emit('update', {
            time: this.formatTime(this.remainingSec),
            status: this.status,
            remainingSec: this.remainingSec,
            totalSec: this.currentTotalSec
        });
        this._emit('status_change', { status: this.status });
    }

    resetToFull() {
        if (this.status === this.STATE.BREAK) {
            // Check if it was a long break
            const isLong = this.completedSessions > 0 && this.completedSessions % this.config.sessionsBeforeLongBreak === 0;
            this.remainingSec = isLong ? this.config.longBreakDurationSec : this.config.breakDurationSec;
        } else {
            this.remainingSec = this.config.workDurationSec;
        }

        this.currentTotalSec = this.remainingSec;
        this.lastCheckTime = 0;

        this._emit('update', {
            time: this.formatTime(this.remainingSec),
            status: this.status,
            remainingSec: this.remainingSec,
            totalSec: this.currentTotalSec
        });
    }

    setConfig(workInfo: any) {
        if (workInfo.duration) {
            this.config.workDurationSec = workInfo.duration * 60;
            if (this.status === this.STATE.IDLE) {
                this.remainingSec = this.config.workDurationSec;
                this._emit('update', { time: this.formatTime(this.remainingSec), status: this.status });
            }
        }
    }

    _startSession(type: string) {
        this.status = type;
        this.sessionStartTime = Date.now() / 1000;
        this.lastCheckTime = 0;

        if (type === this.STATE.WORK) {
            this.remainingSec = this.config.workDurationSec;
            this.currentTotalSec = this.config.workDurationSec;
            this.notifications.notify("Bắt đầu làm việc", "Thời gian tập trung! Chế độ giám sát thông minh đã kích hoạt.");
        } else {
            // Break logic
            const isLong = this.completedSessions > 0 && this.completedSessions % this.config.sessionsBeforeLongBreak === 0;
            this.remainingSec = isLong ? this.config.longBreakDurationSec : this.config.breakDurationSec;
            this.currentTotalSec = this.remainingSec;
            this.notifications.notify("Giờ nghỉ giải lao", "Hãy để mắt nghỉ ngơi. Hệ thống tạm dừng giám sát.");
        }

        this._runTimer();
        this._emit('status_change', { status: this.status });
    }

    _runTimer() {
        this._stopTimer();
        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    _stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    tick() {
        this.remainingSec--;

        // 1. Update UI
        this._emit('update', {
            time: this.formatTime(this.remainingSec),
            status: this.status,
            remainingSec: this.remainingSec,
            totalSec: this.currentTotalSec,
            state: this.status
        });

        // 2. Logic Check (Only during WORK)
        if (this.status === this.STATE.WORK) {
            const elapsed = (Date.now() / 1000) - this.sessionStartTime;

            // Ask Policy Engine if we need a camera check
            if (this.policy.shouldTriggerMidCheck(elapsed, this.config.workDurationSec, this.lastCheckTime)) {
                this.lastCheckTime = elapsed;
                this._emit('camera_check_required', {});
            }
        }

        // 3. Time's Up
        if (this.remainingSec <= 0) {
            if (this.status === this.STATE.WARMUP) {
                this._startSession(this.STATE.WORK);
            } else {
                this._handleSessionComplete();
            }
        }
    }

    _handleSessionComplete() {
        this._stopTimer();

        if (this.status === this.STATE.WORK) {
            this.completedSessions++;
            this.notifications.notify("Hoàn thành phiên", "Phiên này làm tốt đó! Nghỉ ngơi một chút rồi quay lại nha. 🔋", { sound: true });

            this._startSession(this.STATE.BREAK);

        } else if (this.status === this.STATE.BREAK) {
            // Break done -> Automatically start a new WORK session
            console.log('[Timer] Break complete. Looping back to WORK.');
            this.notifications.notify("Kết thúc nghỉ ngơi", "Bắt đầu phiên làm việc mới. Hãy giữ khoảng cách nhé! 🚀");
            this._startSession(this.STATE.WORK);
        }
    }

    // --- Events ---
    on(event: string, callback: Function) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    _emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
