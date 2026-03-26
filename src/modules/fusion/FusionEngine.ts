import { generatePersonalizedAdvice } from '../chatbot/ResponseGenerator';
import { FeatureKey } from '../../types/chatbot';

export interface CameraFusionInput {
    blinkRate: number;
    incompleteBlinkRatio: number;
    confidence: number;
}

export interface FusionResult {
    riskScore: number;
    severity: 'low' | 'moderate' | 'high';
    explanation: string;
    advice: string;
    details: {
        surveyComponent: number;
        cameraComponent: number;
    };
    rawMetrics?: {
        blinkRate: number;
        incompleteBlinkRatio: number;
    }
}

export class FusionEngine {
    private WEIGHTS = {
        SURVEY: 0.7,
        CAMERA: 0.3
    };

    /**
     * Calculate Risk based on Survey Score and Camera Metrics with Dynamic Weighting
     */
    calculateRisk(surveyRiskScore: number, cameraMetrics: CameraFusionInput, features?: Partial<Record<FeatureKey, number>>): FusionResult {
        let finalScore = 0;
        let explanation = "";
        let cameraScore = 0;

        // 1. DYNAMIC WEIGHTING calculation
        // Base weights: Survey 70%, Camera 30%
        // If camera confidence is high (>0.8), we shift towards 50/50 for more objectivity.
        let weightCamera = this.WEIGHTS.CAMERA;
        let weightSurvey = this.WEIGHTS.SURVEY;

        if (cameraMetrics && cameraMetrics.confidence >= 0.8) {
            weightCamera = 0.5;
            weightSurvey = 0.5;
        } else if (cameraMetrics && cameraMetrics.confidence < 0.4) {
            // Very low confidence, rely almost entirely on survey
            weightCamera = 0.1;
            weightSurvey = 0.9;
        }

        // 2. CAMERA SCORING (Objective Metrics)
        if (cameraMetrics && cameraMetrics.confidence > 0.1) {
            // Blink Rate: Normal 15-20. Penalty starts below 15.
            let blinkPenalty = 0;
            if (cameraMetrics.blinkRate < 15) {
                blinkPenalty = (15 - cameraMetrics.blinkRate) * 5; // Max penalty around 75 if blinkRate is 0
            }

            // Incomplete Blink: Significant clinical indicator.
            let incompletePenalty = cameraMetrics.incompleteBlinkRatio * 60;

            cameraScore = Math.min(100, blinkPenalty + incompletePenalty);
        }

        // 3. FUSION LOGIC (Weighted Average)
        finalScore = (surveyRiskScore * weightSurvey) + (cameraScore * weightCamera);

        // 4. SAFETY-OVER-AVERAGE (Veto Logic)
        // If camera shows very high risk (>80) but survey is low, we pull the final score up
        // because physiological data is often more reliable than subjective feelings in early stages.
        let safetyBonus = "";
        if (cameraScore > 80 && surveyRiskScore < 40) {
            finalScore = (finalScore + cameraScore) / 2;
            safetyBonus = " Lưu ý: Dữ liệu quan sát cho thấy mức rủi ro cao hơn cảm nhận cá nhân của bạn.";
        }

        // 5. EXPLANATION GENERATION
        const confidencePct = Math.round((cameraMetrics?.confidence || 0) * 100);
        explanation = `Hệ hợp nhất dữ liệu (${Math.round(weightSurvey * 100)}% khảo sát, ${Math.round(weightCamera * 100)}% camera). Độ tin cậy camera: ${confidencePct}%.`;
        if (safetyBonus) explanation += safetyBonus;

        // Advice mapping
        const suggestions: string[] = [];
        const reasons: string[] = [];

        if (surveyRiskScore > 60) reasons.push("Triệu chứng lâm sàng do bạn tự đánh giá");
        if (cameraMetrics.blinkRate < 10) {
            reasons.push("Tần suất chớp mắt quá thấp");
            suggestions.push("Tập thói quen chớp mắt chủ động mỗi khi chuyển tab làm việc.");
        }
        if (cameraMetrics.incompleteBlinkRatio > 0.3) {
            reasons.push("Chớp mắt không hoàn toàn thường xuyên");
            suggestions.push("Thực hiện bài tập nhắm chặt mắt trong 2 giây để bôi trơn nhãn cầu.");
        }

        // Determine Level
        let severity: 'low' | 'moderate' | 'high' = "low";
        if (finalScore >= 65) severity = "high";
        else if (finalScore >= 35) severity = "moderate";

        // Generate Final Advice
        let personalizedAdvice = "";
        if (features) {
            const adviceItems = generatePersonalizedAdvice(features);
            if (adviceItems.length > 0) {
                personalizedAdvice = "\n\n**Lời khuyên từ chuyên gia:**\n" +
                    adviceItems.slice(0, 3).map(a => `${a.icon} **${a.title}**: ${a.description}`).join('\n');
            }
        }

        let advice = "";
        if (severity === "high") {
            advice = "Nguy cơ cao. " + (suggestions.length > 0 ? suggestions.join(" ") : "Hãy áp dụng quy tắc 20-20-20 và đi khám chuyên khoa.");
        } else if (severity === "moderate") {
            advice = "Nguy cơ trung bình. " + (suggestions.length > 0 ? suggestions[0] : "Hãy nghỉ ngơi mắt sau mỗi 20 phút.");
        } else {
            advice = "Mắt bạn đang ổn định. Hãy tiếp tục duy trì thói quen tốt nhé!";
        }

        advice += personalizedAdvice;

        if (reasons.length > 0) {
            explanation += ` Các yếu tố rủi ro chính: ${reasons.join(", ")}.`;
        }

        return {
            riskScore: Math.round(finalScore),
            severity,
            explanation,
            advice,
            details: {
                surveyComponent: Math.round(surveyRiskScore),
                cameraComponent: Math.round(cameraScore)
            },
            rawMetrics: {
                blinkRate: cameraMetrics.blinkRate,
                incompleteBlinkRatio: cameraMetrics.incompleteBlinkRatio
            }
        };
    }
}
