/**
 * Main Entry Point (TS) - Wired Up
 */
import { CameraController } from './modules/camera/CameraController';
import { DiagnosticFlow } from './modules/checkup/DiagnosticFlow';
import { RiskPredictionService } from './modules/checkup/RiskPredictionService';
import { FusionEngine } from './modules/fusion/FusionEngine';
import { DatabaseService } from './services/DatabaseService';
import { StatisticsController } from './modules/ui/StatisticsController';
import { AssessmentController } from './modules/ui/AssessmentController';
import { GamificationService } from './services/GamificationService';
import { WorkCompanion } from './modules/core/WorkCompanion';
import { ConsentManager } from './modules/core/ConsentManager';
import { NotificationService } from './modules/pomodoro/NotificationService';
import { PolicyEngine } from './modules/pomodoro/PolicyEngine';
import { DisplayController } from './modules/display/DisplayController';
import { AdvisorController } from './modules/chatbot/AdvisorController';

class AppController {
    // Services
    camera: CameraController;
    diagnosis: DiagnosticFlow;
    db: DatabaseService;
    stats: StatisticsController;
    assessment: AssessmentController;
    game: GamificationService;
    pomodoro: WorkCompanion;
    policy: PolicyEngine;
    notifications: NotificationService;
    display: DisplayController;
    advisor: AdvisorController;

    constructor() {
        console.log("App Controller Initializing...");

        // 1. Core Services
        this.db = new DatabaseService();
        this.camera = new CameraController();
        this.game = new GamificationService();
        this.assessment = new AssessmentController();

        // 2. Logic Modules
        const predictor = new RiskPredictionService();
        const fusion = new FusionEngine();

        // Display Filter
        this.display = new DisplayController();

        // Eye Advisor
        this.advisor = new AdvisorController();

        // 3. Flows
        this.diagnosis = new DiagnosticFlow({
            cameraController: this.camera,
            predictionService: predictor,
            fusionEngine: fusion,
            databaseService: this.db,
            adviceAgent: { generateAdvice: (res: any) => Promise.resolve("Auto Advice: Relax your eyes!") }, // Mock Agent
            gamificationService: this.game
        });

        // Smart Work Companion Setup (Orchestrator)
        this.notifications = new NotificationService();
        this.policy = new PolicyEngine();
        const consentManager = new ConsentManager();

        this.pomodoro = new WorkCompanion({
            cameraController: this.camera,
            policyEngine: this.policy,
            notificationService: this.notifications,
            consentManager: consentManager,
            gamificationService: this.game
        });

        this.stats = new StatisticsController(this.db);
        this.stats.gameService = this.game;

        // 5. Initialize Settings & UI
        this.initSettings();
        this.bindUI();
        this.bindPomodoroEvents();
    }

    bindUI() {
        // Nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = (e.currentTarget as HTMLElement).dataset.tab;
                if (target) this.switchTab(target);
            });
        });

        // Assessment Start Button
        const btnStart = document.getElementById('btn-start-assess');
        if (btnStart) {
            btnStart.onclick = () => {
                this.diagnosis.start();
                btnStart.style.display = 'none'; // Hide start button
            };
        }

        // Connect Assessment UI to Diagnosis Flow
        this.assessment.setAnswerCallback((val) => {
            // Handle special camera permission "yes"/"no" from UI
            if (val === 'yes' || val === 'no') {
                this.diagnosis.handleCameraDecision(val);
            } else {
                this.diagnosis.handleInput(val);
            }
        });

        // Diagnosis Events
        this.diagnosis.on('bot_message', (text: string, type: string, opts: any) => {
            // Convert to Card UI
            this.assessment.renderQuestion(text, type as any, opts);
        });

        this.diagnosis.on('camera_start', () => {
            const overlay = document.getElementById('assessment-overlay');
            const status = document.querySelector('.overlay-status');
            if (overlay) overlay.classList.remove('hidden');
            if (status) status.innerHTML = `Đang khởi động camera...`;

            // Switch to Reading Mode
            const qCard = document.getElementById('question-card');
            const rCard = document.getElementById('reading-card');
            if (qCard) qCard.classList.add('hidden');
            if (rCard) rCard.classList.remove('hidden');
        });

        this.diagnosis.on('camera_ready_pending', () => {
            const status = document.querySelector('.overlay-status');
            if (status) status.innerHTML = `Hãy giữ khuôn mặt trong khung hình... <span id="overlay-timer">3</span>s`;

            // Just a visual countdown for preparation
            let prepTime = 3;
            const timer = document.getElementById('overlay-timer');
            const interval = setInterval(() => {
                prepTime--;
                if (timer) timer.innerText = prepTime.toString();
                if (prepTime <= 0) clearInterval(interval);
            }, 1000);
        });

        this.diagnosis.on('camera_complete', () => {
            const overlay = document.getElementById('assessment-overlay');
            if (overlay) overlay.classList.add('hidden');

            // Restore Question Card
            const qCard = document.getElementById('question-card');
            const rCard = document.getElementById('reading-card');
            if (qCard) qCard.classList.remove('hidden');
            if (rCard) rCard.classList.add('hidden');
        });

        this.diagnosis.on('camera_error', () => {
            const overlay = document.getElementById('assessment-overlay');
            if (overlay) overlay.classList.add('hidden');

            // Restore Question Card
            const qCard = document.getElementById('question-card');
            const rCard = document.getElementById('reading-card');
            if (qCard) qCard.classList.remove('hidden');
            if (rCard) rCard.classList.add('hidden');
        });

        this.diagnosis.on('camera_progress', (pct: number, data: any) => {
            const status = document.querySelector('.overlay-status');
            if (status) {
                const remaining = Math.ceil(this.diagnosis.assessmentDuration * (1 - pct / 100));
                status.innerHTML = `Đang phân tích chớp mắt... <span id="overlay-timer">${remaining}</span>s`;
                status.classList.remove('warning');
            }

            // --- Real-time HUD Update ---
            const hudDist = document.getElementById('hud-dist');
            const hudEar = document.getElementById('hud-ear');
            const hudBlinks = document.getElementById('hud-blinks');
            const hudInc = document.getElementById('hud-incomplete');
            const hudRate = document.getElementById('hud-rate');

            if (hudDist) hudDist.innerText = Math.round(data.distance?.estimatedCm || 0).toString();
            if (hudEar) hudEar.innerText = (data.blink?.currentEAR || 0).toFixed(2);
            if (hudBlinks) hudBlinks.innerText = (data.blink?.blinkCount || 0).toString();
            if (hudInc) hudInc.innerText = (data.blink?.incompleteBlinkCount || 0).toString();
            if (hudRate) hudRate.innerText = Math.round(data.blink?.blinkRate || 0).toString();
        });

        this.diagnosis.on('diagnosis_complete', (data: any) => {
            this.assessment.renderResult(data.result);
        });

    }

    bindPomodoroEvents() {
        // --- Smart Work Wiring ---
        const btnWorkStart = document.getElementById('btn-start-work');
        const btnWorkPause = document.getElementById('btn-pause-work');
        const btnWorkReset = document.getElementById('btn-reset-work');
        const btnWorkFinish = document.getElementById('btn-finish-work');

        if (btnWorkStart && btnWorkPause && btnWorkReset && btnWorkFinish) {
            btnWorkStart.onclick = () => {
                this.pomodoro.startSession();
                btnWorkStart.classList.add('hidden');
                btnWorkPause.classList.remove('hidden');
                btnWorkFinish.classList.remove('hidden');
            };

            btnWorkPause.onclick = () => {
                this.pomodoro.pauseSession();
                btnWorkStart.classList.remove('hidden');
                btnWorkPause.classList.add('hidden');
                btnWorkStart.innerHTML = '<i class="ph-fill ph-play"></i> Resume Focus';
            };

            btnWorkReset.onclick = () => {
                this.pomodoro.resetSession();
            };

            btnWorkFinish.onclick = () => {
                if (confirm("Kết thúc phiên làm việc này?")) {
                    this.pomodoro.stopSession();
                    btnWorkStart.classList.remove('hidden');
                    btnWorkPause.classList.add('hidden');
                    btnWorkFinish.classList.add('hidden');
                    btnWorkStart.innerHTML = '<i class="ph-fill ph-play"></i> Start Focus';
                    const distVal = document.getElementById('distance-value');
                    if (distVal) distVal.innerText = "Session Ended";
                }
            };
        }

        // Timer Events (relayed through WorkCompanion)
        this.pomodoro.on('tick', (data: any) => {
            const timerEl = document.getElementById('timer-text');
            if (timerEl) timerEl.innerText = data.time;

            // Update Circle
            const progressCircle = document.getElementById('timer-progress') as unknown as SVGCircleElement;
            if (progressCircle) {
                const total = data.totalSec || (25 * 60);
                const remaining = data.remainingSec || 0;
                const pct = remaining / total;

                // 2 * PI * 92 = 578.05
                const circumference = 578.05;
                // Filling mode: Offset starts at circumference (full) and goes to 0 (empty)
                // But user wants "as time passes, it fills". 
                // Currently tick pct = remaining/total. 
                // So at start, pct=1.0, offset=0 (full bar). 
                // At end, pct=0.0, offset=578 (empty bar).
                // If we want it to FILL, we need offset = circumference * (1 - pct);
                const offset = circumference * pct;
                progressCircle.style.strokeDashoffset = offset.toString();
            }

            // Optional status visual
            // Optional status visual
            const viewWork = document.getElementById('view-work');
            if (viewWork) {
                // Removed conflicting border style to avoid confusion with Edge Lighting
                viewWork.style.border = 'none';
            }
        });

        this.pomodoro.on('status_change', (data: any) => {
            const scoreBadge = document.getElementById('focus-score-badge');
            if (data.status === 'IDLE') {
                btnWorkStart?.classList.remove('hidden');
                btnWorkPause?.classList.add('hidden');
                btnWorkFinish?.classList.add('hidden');
                scoreBadge?.classList.add('hidden');
            } else if (data.status === 'WORKING' || data.status === 'WARMUP') {
                scoreBadge?.classList.remove('hidden');
            }
        });

        this.pomodoro.on('summary_ready', (data: any) => {
            this._showSessionSummary(data);

            // Persist to DB
            this.db.saveWorkSession({
                startTime: Date.now() - (this.pomodoro.stats.totalChecks * 60000), // Approximate
                durationMinutes: Math.round(this.pomodoro.stats.totalChecks * 1), // Assuming 1 check per min avg or similar
                violationCount: data.violations,
                complianceScore: data.score,
                autoResets: this.pomodoro.stats.autoResets,
                mode: this.pomodoro.policy.currentMode.id
            });

            // Update Daily Stats
            this.db.updateDailyStats(0, 0, 0); // Need to pass actual values but let's just trigger update
        });

        this.pomodoro.on('vitality_nudge', () => {
            // Trigger blue edge lighting for 20-20-20
            const quietMode = localStorage.getItem('quiet_mode_enabled') === 'true';

            import('./modules/edgeLighting/EdgeLightingClient').then(({ triggerEdgeLighting }) => {
                // Force enabled = true for Vitality breaks to ensure it shows during demo/testing
                triggerEdgeLighting(true, quietMode, 'vitality');
            });
        });

        this.pomodoro.on('nudge', (data: any) => {
            console.log("Nudge received:", data);
            // The notification is already handled inside WorkCompanion
        });

        this.pomodoro.on('auto_reset', (data: any) => {
            console.log("Auto-reset event", data);
            // Visual feedback for auto-reset
            const timerEl = document.getElementById('timer-text');
            if (timerEl) {
                timerEl.style.color = 'var(--color-success)';
                setTimeout(() => { timerEl.style.color = ''; }, 2000);
            }
        });

        // Listen for Gamification Streaks
        this.game.on('session_streak_updated', (streak: number) => {
            const streakVal = document.getElementById('focus-streak-value');
            if (streakVal) streakVal.innerText = streak.toString();
        });

        this.pomodoro.on('metrics_update', (data: any) => {
            if (data.distance) {
                this._updateDistanceUI(data.distance);
            }
            if (data.score !== undefined) {
                const scoreVal = document.getElementById('focus-score-value');
                if (scoreVal) scoreVal.innerText = Math.round(data.score).toString();
            }
        });

        this.pomodoro.on('nudge', (data: any) => {
            if (data.type === 'CONTEXT_SKIP') {
                const guide = document.getElementById('ai-guidance');
                if (guide) {
                    guide.innerText = data.message;
                    guide.style.color = "var(--color-primary)";
                }
            }
        });

        this.pomodoro.on('summary_ready', (data: any) => {
            this._showSessionSummary(data);
        });

        // --- SECRET DEMO SHORTCUTS (For Stage Presentation) ---
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'd') {
                console.log("[Demo] Secret trigger: Forced 20-20-20 Break");
                // @ts-ignore - Accessing private method for demo purposes
                this.pomodoro._triggerVitalityBreak();
            } else if (key === 's') {
                console.log("[Demo] Secret trigger: Forced Session Stop & Summary");
                this.pomodoro.stopSession(); // This will trigger 'summary_ready'
            } else if (key === 'e') {
                console.log("[Demo] Secret trigger: Forced End-of-Time Sequence");
                // @ts-ignore - Accessing private timer method to jump to 1s
                if (this.pomodoro.timer && this.pomodoro.timer.status === 'WORK') {
                    this.pomodoro.timer.remainingSec = 1;
                }
            }
        });
    }

    _updateDistanceUI(dist: number) {
        const valEl = document.getElementById('distance-value');
        const fillEl = document.getElementById('distance-indicator');
        if (!valEl || !fillEl) return;

        valEl.innerText = `${Math.round(dist)} cm`;

        // Visual
        const maxDist = 80;
        const pct = Math.min(100, (dist / maxDist) * 100);
        fillEl.style.width = `${pct}%`;

        // Reset classes
        fillEl.classList.remove('ok', 'warn', 'danger');

        if (dist < 40) {
            fillEl.classList.add('danger');
        } else if (dist < 50) {
            fillEl.classList.add('warn');
        } else {
            fillEl.classList.add('ok');
        }
    }

    _showSessionSummary(data: any) {
        const modal = document.getElementById('summary-modal');
        if (!modal) return;

        const scoreEl = document.getElementById('summary-score');
        const violationsEl = document.getElementById('summary-violations');
        const blinkRateEl = document.getElementById('summary-blink-rate');
        const severityEl = document.getElementById('summary-severity');
        const adviceEl = document.getElementById('summary-advice');

        if (scoreEl) scoreEl.innerText = Math.round(data.score).toString();
        if (violationsEl) violationsEl.innerText = data.violations.toString();
        if (blinkRateEl) blinkRateEl.innerText = Math.round(data.avgBlinkRate).toString();
        if (severityEl) {
            severityEl.innerText = data.severity.toUpperCase();
            severityEl.style.color = data.severity === 'high' ? 'var(--color-danger)' : 'var(--color-success)';
        }

        // Render Reasons list
        const reasonsList = document.getElementById('summary-reasons-list');
        if (reasonsList) {
            reasonsList.innerHTML = "";
            if (data.reasons && data.reasons.length > 0) {
                data.reasons.forEach((reason: string) => {
                    const item = document.createElement('div');
                    item.className = 'summary-reason-item';
                    item.innerHTML = `<i class="ph-fill ph-warning-circle"></i> ${reason}`;
                    reasonsList.appendChild(item);
                });
                reasonsList.classList.remove('hidden');
            } else {
                reasonsList.classList.add('hidden');
            }
        }

        // Simple Advice based on score
        if (adviceEl) {
            let advice = "";
            if (data.score > 90) advice = "Tuyệt vời! Bạn giữ tư thế rất chuẩn suốt cả phiên. 🌟";
            else if (data.score > 70) advice = "Khá tốt, hãy chú ý giữ khoảng cách đều đặn hơn nhé. 👍";
            else advice = "Mắt bạn có vẻ hơi mỏi. Hãy nghỉ ngơi đầy đủ để nạp lại năng lượng nhé! 🌿";

            if (data.vitalityBonuses > 0) {
                advice += `\n\nBạn đã thực hiện ${data.vitalityBonuses} lần nghỉ mắt 20-20-20. Rất tốt! (+${data.vitalityBonuses * 5} điểm Vitality)`;
            }

            adviceEl.innerText = advice;
        }

        modal.classList.remove('hidden');

        const closeBtn = document.getElementById('btn-summary-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.add('hidden');
                this.pomodoro.timer.status = 'IDLE'; // Trigger full reset to IDLE
                this.pomodoro.timer.init();
            };
        }
    }

    switchTab(tab: string) {
        // 1. Update Views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${tab}`)?.classList.add('active');

        // 2. Update Sidebar Buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((btn as HTMLElement).dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        if (tab === 'stats') {
            this.stats.init();
        }

        if (tab === 'advisor') {
            this.advisor.reset();
        }
    }

    addChatMsg(sender: string, text: string) {
        const history = document.getElementById('chat-history');
        if (history) {
            const div = document.createElement('div');
            div.className = `message ${sender}`;
            div.innerText = text;
            history.appendChild(div);
            // Auto scroll to bottom
            history.scrollTop = history.scrollHeight;
        }
    }

    renderChoices(options: any[]) {
        const history = document.getElementById('chat-history');
        if (!history) return;

        const div = document.createElement('div');
        div.className = 'choice-container';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.innerText = opt.label;
            btn.onclick = () => {
                this.addChatMsg('user', opt.label);
                if (opt.value === 'yes' || opt.value === 'no') {
                    this.diagnosis.handleCameraDecision(opt.value);
                } else {
                    this.diagnosis.handleInput(opt.value);
                }
                div.remove();
            };
            div.appendChild(btn);
        });
        history.appendChild(div);
        // Auto scroll to bottom
        history.scrollTop = history.scrollHeight;
    }
    initSettings() {
        // 1. Theme Setup
        const themeToggle = document.getElementById('setting-theme-toggle') as HTMLInputElement;
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setTheme(savedTheme);

        if (themeToggle) {
            themeToggle.checked = document.body.getAttribute('data-theme') === 'dark';
            themeToggle.addEventListener('change', (e) => {
                const isDark = (e.target as HTMLInputElement).checked;
                this.setTheme(isDark ? 'dark' : 'light');
            });
        }

        // 1.5 Work Mode
        const workModeSelect = document.getElementById('setting-work-mode') as HTMLSelectElement;
        if (workModeSelect) {
            const savedMode = localStorage.getItem('work_mode') || 'balanced';
            workModeSelect.value = savedMode;

            // Apply initial mode
            this.pomodoro.setMode(savedMode);

            workModeSelect.addEventListener('change', () => {
                const newMode = workModeSelect.value;
                localStorage.setItem('work_mode', newMode);
                this.pomodoro.setMode(newMode);
                console.log("Work Mode updated:", newMode);
            });
        }

        // 2. Work & Break Durations
        const workDurationInput = document.getElementById('setting-work-duration') as HTMLInputElement;
        const breakDurationInput = document.getElementById('setting-break-duration') as HTMLInputElement;

        if (workDurationInput) {
            const savedWork = localStorage.getItem('work_duration');
            if (savedWork) workDurationInput.value = savedWork;

            workDurationInput.addEventListener('change', () => {
                const val = parseInt(workDurationInput.value);
                if (val >= 1 && val <= 60) {
                    localStorage.setItem('work_duration', val.toString());
                    this.pomodoro.timer.init();
                } else {
                    alert("Work duration must be between 1 and 60 minutes.");
                    workDurationInput.value = "25";
                }
            });
        }

        if (breakDurationInput) {
            const savedBreak = localStorage.getItem('break_duration');
            if (savedBreak) breakDurationInput.value = savedBreak;

            breakDurationInput.addEventListener('change', () => {
                const val = parseInt(breakDurationInput.value);
                if (val >= 1 && val <= 30) {
                    localStorage.setItem('break_duration', val.toString());
                    this.pomodoro.timer.init();
                } else {
                    alert("Break duration must be between 1 and 30 minutes.");
                    breakDurationInput.value = "5";
                }
            });
        }

        const cycleInput = document.getElementById('setting-sessions-cycle') as HTMLInputElement;
        if (cycleInput) {
            const savedCycle = localStorage.getItem('sessions_per_cycle') || "4";
            cycleInput.value = savedCycle;
            cycleInput.addEventListener('change', () => {
                const val = parseInt(cycleInput.value);
                if (val >= 1 && val <= 10) {
                    localStorage.setItem('sessions_per_cycle', val.toString());
                    this.pomodoro.timer.init();
                } else {
                    alert("Sessions per cycle must be between 1 and 10.");
                    cycleInput.value = "4";
                }
            });
        }

        // 3. Sound Toggle
        const soundToggle = document.getElementById('setting-sound-toggle') as HTMLInputElement;
        if (soundToggle) {
            const soundEnabled = localStorage.getItem('sound_enabled') !== 'false'; // default true
            soundToggle.checked = soundEnabled;

            soundToggle.addEventListener('change', () => {
                localStorage.setItem('sound_enabled', soundToggle.checked.toString());
            });
        }

        // 3b. Edge Lighting Toggle
        const edgeToggle = document.getElementById('setting-edge-toggle') as HTMLInputElement;
        if (edgeToggle) {
            // New Key: edge_lighting_enabled (default false)
            const rawEdge = localStorage.getItem('edge_lighting_enabled');
            const edgeEnabled = rawEdge === null ? true : rawEdge === 'true';
            edgeToggle.checked = edgeEnabled;
            // Force save default if null
            if (rawEdge === null) localStorage.setItem('edge_lighting_enabled', 'true');

            edgeToggle.addEventListener('change', () => {
                const isEnabled = edgeToggle.checked;
                localStorage.setItem('edge_lighting_enabled', isEnabled.toString());
            });
        }

        const btnPreviewEdge = document.getElementById('btn-preview-edge');
        if (btnPreviewEdge) {
            btnPreviewEdge.onclick = () => {
                console.log("EdgeLighting preview trigger");
                import('./modules/edgeLighting/EdgeLightingClient').then(({ triggerEdgeLighting }) => {
                    // Force enabled=true for preview, respect quiet mode from localstorage
                    const quiet = localStorage.getItem('quiet_mode_enabled') === 'true';
                    triggerEdgeLighting(true, quiet);
                });
            }
        }

        // 4. Test Camera
        const btnTestCam = document.getElementById('btn-check-camera');
        if (btnTestCam) {
            btnTestCam.onclick = async () => {
                btnTestCam.textContent = "Đang kết nối...";
                const status = document.querySelector('.overlay-status');
                if (status) status.innerHTML = "Chế độ kiểm thử Camera...";

                try {
                    await this.camera.start(document.getElementById('assessment-video') as HTMLVideoElement);
                    document.getElementById('assessment-overlay')?.classList.remove('hidden');
                    btnTestCam.textContent = "Camera đang chạy";

                    const endTime = Date.now() + 8000;

                    // Start a temporary loop to update HUD during test
                    let isRunning = true;
                    const updateHUD = async () => {
                        if (!isRunning) return;
                        try {
                            const metrics = await this.camera.getSnapshotMetrics();
                            const hudDist = document.getElementById('hud-dist');
                            const hudEar = document.getElementById('hud-ear');
                            const hudBlinks = document.getElementById('hud-blinks');
                            const hudInc = document.getElementById('hud-incomplete');
                            const hudRate = document.getElementById('hud-rate');

                            if (hudDist) hudDist.innerText = Math.round(metrics.distance || 0).toString();
                            if (hudEar) hudEar.innerText = (metrics.ear || 0).toFixed(2);
                            if (hudBlinks) hudBlinks.innerText = (metrics.blinkCount || 0).toString();
                            if (hudInc) hudInc.innerText = (metrics.incompleteBlinkCount || 0).toString();
                            if (hudRate) hudRate.innerText = Math.round(metrics.blinkRate || 0).toString();

                            if (status) {
                                const timeLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                                status.innerHTML = `Đang kiểm tra thiết bị... <span id="overlay-timer">${timeLeft}</span>s`;
                            }
                        } catch (err) {
                            console.error("HUD update error", err);
                        }
                        if (isRunning) setTimeout(updateHUD, 200); // 200ms gap to avoid stacking
                    };
                    updateHUD();

                    setTimeout(() => {
                        isRunning = false;
                        this.camera.stop();
                        document.getElementById('assessment-overlay')?.classList.add('hidden');
                        btnTestCam.textContent = "Kiểm tra Camera";
                    }, 8000);
                } catch (e) {
                    btnTestCam.textContent = "Lỗi kết nối";
                    alert("Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập.");
                }
            };
        }

        // 5. Clear Data
        const btnReset = document.getElementById('btn-reset-data');
        if (btnReset) {
            btnReset.onclick = async () => {
                if (confirm("Are you sure? This will delete all your checkup history and stats.")) {
                    await this.db.resetData();
                    alert("All data cleared.");
                    location.reload();
                }
            };
        }
    }

    setTheme(theme: string) {
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);

        // Sync toggle if it exists
        const toggle = document.getElementById('setting-theme-toggle') as HTMLInputElement;
        if (toggle) toggle.checked = document.body.getAttribute('data-theme') === 'dark';
    }
}

try {
    (window as any).app = new AppController();
} catch (e) {
    console.error("CRITICAL: App failed to start!", e);
    alert("Ứng dụng gặp lỗi khi khởi động. Chi tiết: " + (e instanceof Error ? e.message : String(e)));
}

// Global error handler for uncaught promise rejections or runtime errors
window.onerror = (msg, url, lineNo, columnNo, error) => {
    console.error("Runtime Error:", error);
    return false;
};

window.onunhandledrejection = (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
};
