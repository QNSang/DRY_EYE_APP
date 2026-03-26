/**
 * Work Configuration Presets
 * Defines the behavior of the 4 intelligent modes.
 */

export interface WorkMode {
    id: string;
    label: string;
    description: string;
    checkIntervalSec: number;
    minIntervalSec: number;
    maxIntervalSec: number;
    adaptiveStep: number;     // e.g., 0.25 for 25% change
    verifyTimeSec: number;    // Time for verify pulse after NEAR
    breakIntervalSec: number;
    forceBreak: boolean;
    allowSnooze: boolean;
    adaptive: boolean;
    silentSuccess?: boolean;
    silentMode?: boolean;
    suppressPopups?: boolean;
}

export const WORK_MODES: Record<string, WorkMode> = {
    STRICT: {
        id: 'strict',
        label: 'Strict (Bảo vệ tối đa)',
        description: 'Dành cho người có bệnh lý. Bắt buộc nghỉ, kiểm tra thường xuyên.',
        checkIntervalSec: 7 * 60,   // 7 mins
        minIntervalSec: 5 * 60,
        maxIntervalSec: 10 * 60,
        adaptiveStep: 0.20,
        verifyTimeSec: 25,
        breakIntervalSec: 20 * 60,
        forceBreak: true,
        allowSnooze: false,
        adaptive: true,             // Enable adaptive even in strict but with tight bounds
        silentSuccess: false
    },
    BALANCED: {
        id: 'balanced',
        label: 'Balanced (Cân bằng)',
        description: 'Chế độ mặc định thông minh. Tự động điều chỉnh tần suất.',
        checkIntervalSec: 11 * 60,  // 11 mins
        minIntervalSec: 7 * 60,
        maxIntervalSec: 20 * 60,
        adaptiveStep: 0.25,
        verifyTimeSec: 35,
        breakIntervalSec: 25 * 60,
        forceBreak: false,
        allowSnooze: true,
        adaptive: true,
        silentSuccess: true
    },
    DEEP_FOCUS: {
        id: 'deep_focus',
        label: 'Deep Focus (Tập trung)',
        description: 'Tối ưu cho Flow. Chỉ nhắc nhở nhẹ bằng hình ảnh.',
        checkIntervalSec: 22 * 60,  // 22 mins
        minIntervalSec: 15 * 60,
        maxIntervalSec: 35 * 60,
        adaptiveStep: 0.30,
        verifyTimeSec: 40,
        breakIntervalSec: 50 * 60,
        forceBreak: false,
        allowSnooze: true,
        adaptive: true,
        silentMode: true,
        suppressPopups: true
    },
    CUSTOM: {
        id: 'custom',
        label: 'Custom',
        description: 'Cấu hình cá nhân hóa.',
        checkIntervalSec: 15 * 60,
        minIntervalSec: 5 * 60,
        maxIntervalSec: 30 * 60,
        adaptiveStep: 0.25,
        verifyTimeSec: 30,
        breakIntervalSec: 30 * 60,
        forceBreak: false,
        allowSnooze: true,
        adaptive: false
    }
};

export const DEFAULT_MODE = WORK_MODES.BALANCED;
