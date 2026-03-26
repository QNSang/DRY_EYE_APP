/**
 * ContextDetector
 * Detects if the user is in a state where they should NOT be disturbed.
 * (Meeting, Deep Work, etc.)
 */
export class ContextDetector {
    isMeetingMode: boolean;
    private autoMeetingActive: boolean;
    private lastCameraBusyTime: number;

    constructor() {
        this.isMeetingMode = false;
        this.autoMeetingActive = false;
        this.lastCameraBusyTime = 0;
    }

    /**
     * Should we skip the check?
     * @returns {Object} { skip: boolean, reason: string }
     */
    shouldSkipCheck() {
        // 1. Manual Toggle
        if (this.isMeetingMode) {
            return { skip: true, reason: 'Meeting Mode (Manual)' };
        }

        // 2. Auto-Detection (Camera Busy)
        const now = Date.now();
        // Skip for 10 minutes if camera was found busy
        if (this.autoMeetingActive && (now - this.lastCameraBusyTime < 10 * 60000)) {
            return { skip: true, reason: 'Auto-Meeting Detect (Camera Busy)' };
        } else if (this.autoMeetingActive) {
            this.autoMeetingActive = false; // Reset after cooldown
        }

        return { skip: false, reason: '' };
    }

    /**
     * Signal that the camera is busy (detected by capture failure)
     */
    reportCameraBusy() {
        this.autoMeetingActive = true;
        this.lastCameraBusyTime = Date.now();
        console.log('[Context] Auto-Meeting detected via camera occupancy');
    }

    setMeetingMode(isActive: boolean) {
        this.isMeetingMode = isActive;
        console.log(`[Context] Meeting Mote set to: ${isActive}`);
    }
}
