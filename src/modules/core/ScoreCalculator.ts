/**
 * ScoreCalculator
 * Calculates the Visual Comfort/Focus Score for a session.
 * Base score: 100
 */

export interface SessionMetrics {
    events: string[];        // Array of "NEAR_EVENT_CONFIRMED", "NEAR_EVENT_SELF_CORRECTED"
    incompleteBlinkRatio: number;
    isCompleted: boolean;
    vitalityBonuses: number; // Number of 20-20-20 breaks taken
    hasProtection?: boolean;
}

export class ScoreCalculator {
    /**
     * Calculate score based on plan:
     * - Baseline: 100
     * - -5 per "NEAR" violation
     * - -10 per 10% increase in Incomplete Blink Ratio above 0.3 (baseline)
     * - -2 per low quality sample
     * - +10 bonus for full completion with 0 violations
     */
    static calculate(metrics: SessionMetrics): number {
        let score = 100;

        // 1. Posture Events
        const confirmedNear = metrics.events.filter(e => e === 'NEAR_EVENT_CONFIRMED').length;
        const correctedNear = metrics.events.filter(e => e === 'NEAR_EVENT_SELF_CORRECTED').length;

        const multiplier = metrics.hasProtection ? 0.5 : 1.0;
        score -= (confirmedNear * 5 * multiplier);
        score -= (correctedNear * 0 * multiplier); // No deduction for self-correction

        // 2. Fatigue (Incomplete Blink Ratio)
        // Stepped deduction: >0.3 (+5), >0.4 (+10), >0.5 (+15)
        if (metrics.incompleteBlinkRatio > 0.5) {
            score -= 15;
        } else if (metrics.incompleteBlinkRatio > 0.4) {
            score -= 10;
        } else if (metrics.incompleteBlinkRatio > 0.3) {
            score -= 5;
        }

        // 3. Vitality Bonus (+5 per 20-20-20 break)
        score += metrics.vitalityBonuses * 5;

        // 4. Completion Bonus (Clean session)
        if (metrics.isCompleted && confirmedNear === 0) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    static getSeverity(score: number): 'low' | 'moderate' | 'high' {
        if (score >= 80) return 'low';
        if (score >= 60) return 'moderate';
        return 'high';
    }
}
