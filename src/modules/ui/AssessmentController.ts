/**
 * AssessmentController
 * Handles the UI for the Guided Assessment Redesign
 */

import { QUESTION_BANK } from '../chatbot/QuestionBank';

export class AssessmentController {
    private cardContainer: HTMLElement | null;
    private progressContainer: HTMLElement | null;
    private progressFill: HTMLElement | null;
    private progressText: HTMLElement | null;

    // Callback for sending answer back to system
    private onAnswer: (value: string) => void = () => { };

    private currentStep: number = 0;
    private totalSteps: number = Object.keys(QUESTION_BANK).length;

    constructor() {
        this.cardContainer = document.getElementById('question-card');
        this.progressContainer = document.getElementById('assessment-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-current');
    }

    setAnswerCallback(fn: (val: string) => void) {
        this.onAnswer = fn;
    }

    /**
     * Display a question in the card
     */
    renderQuestion(text: string, type: 'choice' | 'text', options: any[] = []) {
        if (!this.cardContainer) return;

        // Show Progress Bar if hidden
        this.progressContainer?.classList.remove('hidden');
        this.updateProgress();

        // Animate Out
        this.cardContainer.style.opacity = '0';
        this.cardContainer.style.transform = 'translateY(10px)';

        setTimeout(() => {
            let html = `<div class="question-text">${text}</div>`;

            if (type === 'choice' && options.length > 0) {
                html += `<div class="options-grid">`;
                options.forEach(opt => {
                    const iconClass = this.getIconForOption(opt.label, opt.value);
                    html += `<button class="option-btn" data-val="${opt.value}">
                        <span class="btn-icon"><i class="${iconClass}"></i></span>
                        <span class="btn-label">${opt.label}</span>
                        <span class="btn-arrow"><i class="ph ph-caret-right"></i></span>
                    </button>`;
                });
                html += `</div>`;
            } else {
                // Fallback for text input (rare in this app now)
                html += `<div style="display:flex; gap:10px;">
                    <input type="text" id="assess-input" class="modern-input" placeholder="Type here..." style="flex:1; padding:1rem; border-radius:8px; border:1px solid #ddd;">
                    <button id="assess-send" class="primary-btn">Next</button>
                </div>`;
            }

            if (this.cardContainer) {
                this.cardContainer.innerHTML = html;

                // Bind events
                this.cardContainer.querySelectorAll('.option-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const val = (e.currentTarget as HTMLElement).dataset.val;
                        if (val) this.handleSelection(val);
                    });
                });

                const sendBtn = document.getElementById('assess-send');
                if (sendBtn) {
                    sendBtn.onclick = () => {
                        const input = document.getElementById('assess-input') as HTMLInputElement;
                        if (input.value) this.handleSelection(input.value);
                    };
                }
            }

            // Animate In
            if (this.cardContainer) {
                this.cardContainer.style.opacity = '1';
                this.cardContainer.style.transform = 'translateY(0)';
            }
        }, 300);
    }

    handleSelection(value: string) {
        // Optimistic UI update or wait for next?
        // Let's call callback
        this.currentStep++;
        this.onAnswer(value);
    }

    renderResult(result: any) {
        if (!this.cardContainer) return;
        this.progressContainer?.classList.add('hidden'); // Hide progress

        const severity = result.severity;
        const score = result.riskScore;

        let statusColor = "var(--color-success)";
        let statusBg = "rgba(34, 197, 94, 0.1)";
        let statusLabel = "Bình thường / Ổn định";
        let statusIcon = "ph-duotone ph-check-circle";

        if (severity === 'high') {
            statusColor = "var(--color-danger)";
            statusBg = "rgba(239, 68, 68, 0.1)";
            statusLabel = "Nguy cơ Nghiêm trọng";
            statusIcon = "ph-duotone ph-warning-octagon";
        } else if (severity === 'moderate') {
            statusColor = "var(--color-warning)";
            statusBg = "rgba(245, 158, 11, 0.1)";
            statusLabel = "Nguy cơ Trung bình";
            statusIcon = "ph-duotone ph-warning";
        }

        // Format advice: replace **text** with <strong>text</strong> and \n with <br>
        let formattedAdvice = result.advice
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        this.cardContainer.innerHTML = `
            <div class="medical-report">
                <div class="report-header">
                    <div class="report-title">
                        <i class="ph-duotone ph-scroll"></i>
                        PHÁC ĐỒ CHẨN ĐOÁN THỊ LỰC
                    </div>
                    <div class="report-date">${new Date().toLocaleDateString('vi-VN')}</div>
                </div>

                <div class="report-body">
                    <div class="status-badge-container" style="background: ${statusBg}; border: 1px solid ${statusColor};">
                        <div class="status-icon" style="color: ${statusColor};">
                            <i class="${statusIcon}"></i>
                        </div>
                        <div class="status-info" style="flex: 1;">
                            <div class="status-label" style="color: ${statusColor};">${statusLabel}</div>
                            <div class="status-score-container" style="display: flex; align-items: center; gap: 10px;">
                                <div class="risk-gauge-bg" style="flex: 1; height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
                                    <div class="risk-gauge-fill" style="width: ${score}%; height: 100%; background: ${statusColor}; border-radius: 4px;"></div>
                                </div>
                                <div class="status-score" style="white-space: nowrap;">Rủi ro: <strong>${score}/100</strong></div>
                            </div>
                        </div>
                    </div>

                     <div class="report-section">
                        <div class="section-title"><i class="ph-duotone ph-chart-bar"></i> Chỉ số đo lường & So sánh khoa học</div>
                        <div class="metrics-grid">
                            <div class="metric-item highlight">
                                <div class="metric-main">
                                    <span class="metric-label">Tần suất chớp mắt</span>
                                    <span class="metric-desc">Khoa học: 15-20 lần/phút</span>
                                </div>
                                <div class="metric-result">
                                    <span class="metric-value">${result.rawMetrics?.blinkRate || 0}</span>
                                    <span class="metric-unit">lần/phút</span>
                                </div>
                            </div>
                            <div class="metric-item highlight">
                                <div class="metric-main">
                                    <span class="metric-label">Tỉ lệ chớp mắt lỗi</span>
                                    <span class="metric-desc">Khoa học: < 10%</span>
                                </div>
                                <div class="metric-result">
                                    <span class="metric-value">${Math.round((result.rawMetrics?.incompleteBlinkRatio || 0) * 100)}</span>
                                    <span class="metric-unit">%</span>
                                </div>
                            </div>
                             <div class="metric-item">
                                <div class="metric-main">
                                    <span class="metric-label">Triệu chứng (Survey)</span>
                                    <span class="metric-desc">Mức độ rủi ro ML</span>
                                </div>
                                <div class="metric-result">
                                    <span class="metric-value" style="color: ${result.details.surveyComponent > 60 ? 'var(--color-danger)' : 'var(--color-primary)'}">${result.details.surveyComponent}%</span>
                                </div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-main">
                                    <span class="metric-label">Quan sát (Camera)</span>
                                    <span class="metric-desc">Mức độ rủi ro đo được</span>
                                </div>
                                <div class="metric-result">
                                    <span class="metric-value" style="color: ${result.details.cameraComponent > 60 ? 'var(--color-danger)' : 'var(--color-primary)'}">${result.details.cameraComponent}%</span>
                                </div>
                            </div>
                            <div class="metric-item highlight" style="grid-column: span 2;">
                                <div class="metric-main">
                                    <span class="metric-label">Cấu trúc Fusion (Độ ưu tiên)</span>
                                    <span class="metric-desc">Tỷ lệ đóng góp vào kết quả cuối cùng</span>
                                </div>
                                <div class="metric-result">
                                    <span class="metric-value">${result.explanation.includes('50%') ? '50:50 (Cân bằng)' : '70:30 (Ưu tiên triệu chứng)'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="report-divider"></div>

                    <div class="report-section">
                        <div class="section-title"><i class="ph-duotone ph-stethoscope"></i> Kết luận chuyên khoa & Nguyên nhân</div>
                        <div class="section-content" style="background: rgba(0,0,0,0.03); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--color-primary);">
                            ${result.explanation}
                        </div>
                    </div>

                    <div class="report-divider"></div>

                    <div class="report-section">
                        <div class="section-title"><i class="ph-duotone ph-clipboard-text"></i> Chỉ định & Lời khuyên</div>
                        <div class="section-content advice-list">
                            ${formattedAdvice}
                        </div>
                    </div>
                </div>

                <div class="report-footer">
                    <div class="doctor-signature">
                        <div class="signature-line"></div>
                        <div class="doctor-name">Hệ thống AI Care Advisor</div>
                        <div class="doctor-title">Trợ lý sức khỏe kĩ thuật số</div>
                    </div>
                    <button class="primary-btn" onclick="window.location.reload()" style="margin-top: 1rem;">
                        <i class="ph ph-house"></i> Quay lại Trang chủ
                    </button>
                </div>
            </div>
        `;

        // Add some localized styles if not in CSS
        if (!document.getElementById('medical-report-styles')) {
            const style = document.createElement('style');
            style.id = 'medical-report-styles';
            style.innerHTML = `
                .medical-report {
                    text-align: left;
                    padding: 1rem;
                    background: var(--bg-card);
                    border-radius: 16px;
                    animation: fadeIn 0.5s ease;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    border-bottom: 2px solid var(--border-color);
                    padding-bottom: 0.5rem;
                }
                .report-title {
                    font-weight: 800;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: 1px;
                }
                .report-date {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                .status-badge-container {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.2rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                }
                .status-icon {
                    font-size: 3rem;
                }
                .status-label {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .status-score {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .report-section {
                    margin-bottom: 1.5rem;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    padding-left: 1.8rem;
                }
                .metric-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-body);
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                }
                .metric-item.highlight {
                    border-left: 4px solid var(--color-primary);
                }
                .metric-main {
                    display: flex;
                    flex-direction: column;
                }
                .metric-label {
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: var(--text-main);
                }
                .metric-desc {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .metric-result {
                    text-align: right;
                }
                .metric-value {
                    font-weight: 800;
                    font-size: 1.1rem;
                    color: var(--color-primary);
                    display: block;
                }
                .metric-unit {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }
                .section-title {
                    font-weight: 700;
                    font-size: 1rem;
                    margin-bottom: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-main);
                }
                .section-content {
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    padding-left: 1.8rem;
                }
                .report-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 1.5rem 0;
                    border-style: dashed;
                }
                .advice-list {
                    background: var(--bg-body);
                    padding: 1rem 1rem 1rem 2.8rem;
                    border-radius: 8px;
                }
                .report-footer {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                .doctor-signature {
                    text-align: center;
                    margin-bottom: 1rem;
                }
                .signature-line {
                    width: 150px;
                    height: 1px;
                    background: var(--text-muted);
                    margin: 0 auto 8px;
                }
                .doctor-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-main);
                }
                .doctor-title {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateProgress() {
        if (this.progressFill && this.progressText) {
            const pct = Math.min(100, (this.currentStep / this.totalSteps) * 100);
            this.progressFill.style.width = `${pct}%`;
            this.progressText.innerText = `${Math.min(this.currentStep + 1, this.totalSteps)}`;
        }
    }

    private getIconForOption(label: string, value: string): string {
        const lower = label.toLowerCase();
        // Yes / No
        if (lower === 'yes' || lower.includes('có')) return 'ph-duotone ph-check-circle';
        if (lower === 'no' || lower.includes('không')) return 'ph-duotone ph-x-circle';

        // Frequency / Time
        if (lower.includes('never') || lower.includes('không bao giờ')) return 'ph-duotone ph-minus-circle';
        if (lower.includes('rarely') || lower.includes('hiếm khi')) return 'ph-duotone ph-cloud-sun';
        if (lower.includes('sometimes') || lower.includes('thỉnh thoảng')) return 'ph-duotone ph-question';
        if (lower.includes('often') || lower.includes('thường xuyên')) return 'ph-duotone ph-warning';
        if (lower.includes('always') || lower.includes('luôn luôn')) return 'ph-duotone ph-warning-octagon';

        // Hours
        if (lower.includes('hour') || lower.includes('tiếng') || lower.includes('h')) return 'ph-duotone ph-clock';
        if (lower.includes('minute') || lower.includes('phút')) return 'ph-duotone ph-timer';

        // Severity
        if (lower.includes('low') || lower.includes('thấp')) return 'ph-duotone ph-shield-check';
        if (lower.includes('medium') || lower.includes('vừa')) return 'ph-duotone ph-shield-warning';
        if (lower.includes('high') || lower.includes('cao')) return 'ph-duotone ph-shield-plus';
        if (lower.includes('severe') || lower.includes('nặng')) return 'ph-duotone ph-first-aid-kit';

        // Devices
        if (lower.includes('laptop') || lower.includes('computer')) return 'ph-duotone ph-laptop';
        if (lower.includes('phone') || lower.includes('mobile')) return 'ph-duotone ph-device-mobile';
        if (lower.includes('tablet')) return 'ph-duotone ph-device-tablet';

        // Gender / Personal
        if (lower.includes('male') || lower.includes('nam')) return 'ph-duotone ph-gender-male';
        if (lower.includes('female') || lower.includes('nữ')) return 'ph-duotone ph-gender-female';
        if (lower.includes('other') || lower.includes('khác')) return 'ph-duotone ph-user';

        // Default bullet
        return 'ph-duotone ph-circle';
    }
}
