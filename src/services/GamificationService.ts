import { db } from './DatabaseService';
import { Achievement } from '../types/db';
import confetti from 'canvas-confetti';
import { EventEmitter } from '../modules/utils/EventEmitter';

const BADGES: Achievement[] = [
    { id: 'first_step', name: 'First Step', description: 'Complete your first eye checkup', icon: '🥉' },
    { id: 'eagle_eye', name: 'Eagle Eye', description: 'Achieve perfect blink rate (>15 bpm)', icon: '🦅' },
    { id: 'consistency_3', name: 'On Fire', description: 'Reach a 3-day streak', icon: '🔥' },
    { id: 'zen_master', name: 'Zen Master', description: 'Report low stress levels', icon: '🧘' },
    { id: 'night_owl', name: 'Night Owl Awareness', description: 'Complete a checkup late at night', icon: '🦉' }
];

export class GamificationService extends EventEmitter {
    private sessionStreak: number = 0;

    constructor() {
        super();
        this.initBadges();
        this.checkStreak();
    }

    /** Real-time Session Streak Logic */
    recordGoodCheck() {
        this.sessionStreak++;
        this.emit('session_streak_updated', this.sessionStreak);

        if (this.sessionStreak % 5 === 0) {
            this.showToast(`🔥 Hooray! ${this.sessionStreak} focus checks in a row!`);
        }
    }

    recordViolation() {
        if (this.sessionStreak > 0) {
            this.sessionStreak = 0;
            this.emit('session_streak_updated', this.sessionStreak);
        }
    }

    getSessionStreak() {
        return this.sessionStreak;
    }

    async initBadges() {
        // Ensure all defined badges exist in DB (locked state)
        const existing = await db.achievements.toArray();
        const existingIds = new Set(existing.map(b => b.id));

        const toAdd = BADGES.filter(b => !existingIds.has(b.id));
        if (toAdd.length > 0) {
            await db.achievements.bulkAdd(toAdd);
        }
    }

    async checkStreak() {
        const today = new Date().toISOString().split('T')[0];

        // 1. Get last 10 days of stats
        const stats = await db.dailyStats.orderBy('date').reverse().limit(10).toArray();
        if (stats.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date(today);

        // Check if user was active today or yesterday (to keep streak alive)
        const lastActiveDate = stats[0].date;
        const diffDays = Math.floor((new Date(today).getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            streak = 0; // Streak broken
        } else {
            // Count contiguous days back
            streak = 1;
            for (let i = 0; i < stats.length - 1; i++) {
                const nextDate = new Date(stats[i].date);
                const prevDate = new Date(stats[i + 1].date);
                const diff = Math.floor((nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diff === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        // 2. Update UserProgress
        const todayStr = new Date().toISOString().split('T')[0];
        await db.userProgress.put({ key: 'streak', value: streak, lastUpdated: todayStr });

        // 3. Unlock condition
        if (streak >= 3) {
            await this.unlockIf('consistency_3', true);
        }

        return streak;
    }

    async handleCheckupCompletion(result: any) {
        // 1. Check First Step
        await this.unlockIf('first_step', true);

        // 2. Eagle Eye
        if (result.blinkRate > 15) {
            await this.unlockIf('eagle_eye', true);
        }

        // 3. Zen Master
        // Need to check survey answers. simplified:
        if (result.riskScore < 30) {
            await this.unlockIf('zen_master', true);
        }

        // Trigger Confetti if Risk is Low/Normal
        if (result.severity !== 'high') {
            this.triggerConfetti();
        }
    }

    async unlockIf(badgeId: string, condition: boolean) {
        if (!condition) return;

        const badge = await db.achievements.get(badgeId);
        if (badge && !badge.unlockedAt) {
            // Unlock!
            await db.achievements.update(badgeId, { unlockedAt: Date.now() });
            this.showToast(`🏆 Badge Unlocked: ${badge.name}!`);
            this.triggerConfetti();
        }
    }

    triggerConfetti() {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    showToast(msg: string) {
        // Simple DOM Toast
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.background = '#333';
        div.style.color = '#fff';
        div.style.padding = '12px 24px';
        div.style.borderRadius = '8px';
        div.style.zIndex = '9999';
        div.innerText = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }

    async getAllBadges() {
        return await db.achievements.toArray();
    }
}
