/**
 * Statistics Controller
 * Handles fetching and visualizing history data
 */

import { DatabaseService } from '../../services/DatabaseService';

export class StatisticsController {
    public gameService: any;
    constructor(private db: DatabaseService) { }

    async init() {
        console.log("Initializing Stats View...");
        await this.renderStats();
    }

    async renderStats() {
        const history = await this.db.getHistory();
        const workSessions = await this.db.getWorkSessions();
        const container = document.getElementById('stats-container');
        if (!container) return;

        let html = `<div class="stats-dashboard">`;

        // 1. Render Trend Chart
        html += this.generateTrendChart(history);

        // 2. Render Checkup Table
        html += `<div class="stats-section">
                    <h2>📋 Lịch sử kiểm tra</h2>
                    ${this.generateHistoryTable(history)}
                 </div>`;

        // 3. Render Work Sessions Table
        html += `<div class="stats-section">
                    <h2>⌛ Lịch sử làm việc</h2>
                    ${this.generateWorkSessionTable(workSessions)}
                 </div>`;

        // 4. Render Achievements
        if (this.gameService) {
            const badges = await this.gameService.getAllBadges();
            html += `<div class="stats-section">
                        <h2>🏆 Thành tựu</h2>
                        ${this.generateBadgesGrid(badges)}
                     </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    private generateTrendChart(history: any[]) {
        if (history.length < 2) return '';

        const data = [...history].reverse().slice(-7); // Last 7 records
        const scores = data.map(d => d.riskScore);
        const maxScore = 100;

        const width = 600;
        const height = 150;
        const padding = 20;

        const points = scores.map((s, i) => {
            const x = padding + (i * (width - 2 * padding) / (scores.length - 1));
            const y = height - padding - (s * (height - 2 * padding) / maxScore);
            return `${x},${y}`;
        }).join(' ');

        return `
            <div class="stats-section chart-container">
                <h2>📈 Biểu đồ xu hướng rủi ro</h2>
                <div style="background: var(--bg-card); border-radius: 20px; padding: 25px; border: 1px solid var(--border-subtle); margin-top: 10px; box-shadow: var(--shadow-soft);">
                    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto;">
                        <!-- Grids -->
                        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--border-subtle)" />
                        <line x1="${padding}" y1="${(height / 2)}" x2="${width - padding}" y2="${(height / 2)}" stroke="var(--border-subtle)" />
                        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--text-secondary)" opacity="0.2" />
                        
                        <!-- Area -->
                        <polyline points="${padding},${height - padding} ${points} ${width - padding},${height - padding}" fill="rgba(65, 105, 225, 0.1)" />
                        
                        <!-- Line -->
                        <polyline points="${points}" fill="none" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        
                        <!-- Points -->
                        ${scores.map((s, i) => {
            const [x, y] = points.split(' ')[i].split(',');
            return `<circle cx="${x}" cy="${y}" r="4" fill="var(--bg-card)" stroke="var(--color-primary)" stroke-width="2" />`;
        }).join('')}
                    </svg>
                    <div style="display:flex; justify-content: space-between; margin-top: 5px; color: var(--text-secondary); font-size: 10px;">
                        <span>Cũ nhất</span>
                        <span>Mới nhất</span>
                    </div>
                </div>
            </div>
        `;
    }

    private generateHistoryTable(history: any[]) {
        if (history.length === 0) return `<p>Chưa có dữ liệu. Hãy thực hiện kiểm tra đầu tiên!</p>`;

        let rows = history.map(rec => {
            const dateC = new Date(rec.timestamp).toLocaleDateString();
            const color = rec.severity === 'high' ? 'var(--color-danger)' : (rec.severity === 'moderate' ? 'var(--color-warning)' : 'var(--color-success)');
            return `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 10px 0;">${dateC}</td>
                    <td style="font-weight: bold; color: ${color};">${rec.riskScore}%</td>
                    <td>${rec.blinkCount || 0} lần</td>
                    <td>${rec.blinkRate} bpm</td>
                    <td>${Math.round((rec.incompleteBlinkRatio || 0) * 100)}%</td>
                </tr>
            `;
        }).join('');

        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="text-align: left; color: var(--text-secondary); font-size: 12px; border-bottom: 2px solid var(--border-subtle);">
                        <th style="padding-bottom: 8px;">Ngày</th>
                        <th style="padding-bottom: 8px;">Rủi ro</th>
                        <th style="padding-bottom: 8px;">Số lần</th>
                        <th style="padding-bottom: 8px;">Tốc độ</th>
                        <th style="padding-bottom: 8px;">Chớp KHT</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    private generateWorkSessionTable(sessions: any[]) {
        if (sessions.length === 0) return `<p>Chưa có phiên làm việc nào được ghi nhận.</p>`;

        let rows = sessions.map(s => {
            const dateC = new Date(s.startTime).toLocaleTimeString();
            const duration = s.durationMinutes + "m";
            const scoreColor = s.complianceScore > 80 ? 'var(--color-success)' : (s.complianceScore > 60 ? 'var(--color-warning)' : 'var(--color-danger)');

            return `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 10px 0;">${dateC}</td>
                    <td style="font-weight: bold; color: ${scoreColor};">${Math.round(s.complianceScore)}</td>
                    <td>${duration}</td>
                    <td>${s.violationCount} lỗi</td>
                    <td>${s.autoResets} lần nghỉ</td>
                </tr>
            `;
        }).join('');

        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="text-align: left; color: var(--text-secondary); font-size: 12px; border-bottom: 2px solid var(--border-subtle);">
                        <th style="padding-bottom: 8px;">Giờ</th>
                        <th style="padding-bottom: 8px;">Điểm số</th>
                        <th style="padding-bottom: 8px;">Thời lượng</th>
                        <th style="padding-bottom: 8px;">Vi phạm</th>
                        <th style="padding-bottom: 8px;">Tự ngắt</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    private generateBadgesGrid(badges: any[]) {
        let grid = badges.map((b: any) => {
            const isUnlocked = !!b.unlockedAt;
            return `
                <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon">${b.icon}</div>
                    <div class="badge-name">${b.name}</div>
                </div>
            `;
        }).join('');

        return `<div class="badges-grid">${grid}</div>`;
    }

    async renderHistory() {
        // Obsolete - consolidated into renderStats
    }
}
