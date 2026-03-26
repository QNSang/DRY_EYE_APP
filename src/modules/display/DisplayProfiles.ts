export type DisplayProfileId = 'pause' | 'health' | 'game' | 'movie' | 'office' | 'editing' | 'reading' | 'custom';

export interface DisplayFilterPayload {
    enabled: boolean;
    profileId: DisplayProfileId;

    // Core (CareUEyes style)
    warmthK: number;         // 6500 (Cool) -> 1000 (Warm)
    brightnessPct: number;   // 0..100 (%)

    // Effects
    invert: boolean;         // for Editing
    grayscale: boolean;      // for Reading (E-ink)

    // Advanced (Optional/Hidden defaults)
    contrastPct?: number;    // default 100
    saturationPct?: number;  // default 100

    // Meta
    description?: string;
}

export const DISPLAY_PRESETS: Record<DisplayProfileId, Partial<DisplayFilterPayload>> = {
    pause: {
        warmthK: 6500,
        brightnessPct: 100,
        invert: false,
        grayscale: false,
        description: "Maintain the system normal brightness and color temperature, adjust the color temperature to 6500K and 100% brightness"
    },
    health: {
        warmthK: 5000,
        brightnessPct: 90,
        invert: false,
        grayscale: false,
        description: "Slightly lower color temperature and brightness, darker than office mode, suitable for people who are sensitive to light"
    },
    game: {
        warmthK: 6500,
        brightnessPct: 90,
        invert: false,
        grayscale: false,
        description: "Normal color temperature, reduce the brightness, keep true colors"
    },
    movie: {
        warmthK: 6000,
        brightnessPct: 90,
        invert: false,
        grayscale: false,
        description: "Suitable for watching movies in a dark room, which not only protects the eyes but also maintains the true colors of the movie"
    },
    office: {
        warmthK: 5500,
        brightnessPct: 85,
        invert: false,
        grayscale: false,
        description: "Without affecting the work, slightly reduce the color temperature and screen brightness"
    },
    editing: {
        warmthK: 6500,
        brightnessPct: 85,
        invert: true,
        grayscale: false,
        description: "Invert the screen color, white background becomes black, black becomes white, suitable for editing text"
    },
    reading: {
        warmthK: 6500, // Neutral (no yellow tint)
        brightnessPct: 85,
        invert: false,
        grayscale: true,
        contrastPct: 115,
        saturationPct: 0,
        description: "Make all colors black and white like E-ink devices, using for reading"
    },
    custom: {
        description: "Custom Settings"
    }
};

export const DEFAULT_STATE: DisplayFilterPayload = {
    enabled: false,
    profileId: 'pause', // Default to Pause (User Request)
    warmthK: 6500,
    brightnessPct: 100,
    invert: false,
    grayscale: false,
    contrastPct: 100,
    saturationPct: 100
};
