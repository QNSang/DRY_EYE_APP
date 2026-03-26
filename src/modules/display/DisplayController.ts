import { DisplayFilterPayload, DisplayProfileId, DISPLAY_PRESETS, DEFAULT_STATE } from './DisplayProfiles';
import { applyDisplaySettings } from './DisplayClient';

export class DisplayController {
    private state: DisplayFilterPayload;
    private readonly STORAGE_KEY = 'displayFilterSettings';

    constructor() {
        // Load or Default
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
            } catch {
                this.state = DEFAULT_STATE;
            }
        } else {
            this.state = DEFAULT_STATE;
        }

        // FORCE PAUSE ON STARTUP (User Request)
        // Even if we have saved settings, we always start in Pause mode.
        this.state.enabled = false;
        this.state.profileId = 'pause';

        this.initUI();

        // Startup broadcast
        setTimeout(() => {
            this.broadcast();
            this.syncUI(); // Ensure UI reflects the forced Pause state
        }, 1000);
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    private broadcast() {
        applyDisplaySettings(this.state);
    }

    private initUI() {
        // 1. Master Toggle
        const toggle = document.getElementById('display-enable-toggle') as HTMLInputElement;
        if (toggle) {
            toggle.checked = this.state.enabled;
            this.updateContainerState();

            toggle.addEventListener('change', () => {
                this.state.enabled = toggle.checked;
                this.save();
                this.broadcast();
                this.updateContainerState();
            });
        }

        // 2. Preset Buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const profile = target.dataset.profile as DisplayProfileId;
                if (profile && DISPLAY_PRESETS[profile]) {
                    this.applyPreset(profile);
                }
            });
        });

        // 3. Sliders
        // Warmth (K)
        this.bindSlider('slider-warmth', 'warmthK', (val) => {
            // Inverted logic for slider? 
            // Usually sliders go LEFT(Low) to RIGHT(High).
            // Spec says: Left "Warm" (Low K), Right "Cool" (High K) OR vice-versa?
            // Specs: "Left Warm, Right Cool" implies specific direction.
            // Let's assume standard slider: min 3000, max 6500.
            // If user wants Left=Warm, standard is actually Left=Low Value.
            // So 3000 (Warm) <---> 6500 (Cool).
            // If UI labels say "Warm" .. "Cool", then Min=Warm, Max=Cool.
            return `${val}K`;
        });

        // Brightness (%)
        this.bindSlider('slider-brightness', 'brightnessPct', (val) => {
            // Left "Dimmer" (Low %), Right "Brighter" (High %)
            return `${val}%`;
        });

        this.setupPresetButtons();

        // Reset Button Logic
        const refreshBtn = document.getElementById('btn-warmth-reset');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.state.warmthK = 6500;
                this.save();
                this.broadcast();
                this.syncUI();
            });
        }
        // Brightness reset (optional, if UI exists)
        const brightReset = document.getElementById('btn-brightness-reset');
        if (brightReset) {
            brightReset.addEventListener('click', () => {
                this.state.brightnessPct = 100;
                this.save();
                this.broadcast();
                this.syncUI();
            });
        }

        this.syncUI();
    }

    private updateContainerState() {
        const container = document.getElementById('display-controls');
        if (container) {
            if (this.state.enabled) container.classList.remove('disabled');
            else container.classList.add('disabled');
        }
    }

    private bindSlider(id: string, prop: keyof DisplayFilterPayload, formatLabel?: (v: number) => string) {
        const slider = document.getElementById(id) as HTMLInputElement;
        const pill = document.getElementById(`${id}-pill`);

        if (slider) {
            // Initial set
            if (pill && formatLabel) {
                this.setPill(slider, pill, formatLabel(parseInt(slider.value)));
            }

            slider.addEventListener('input', () => {
                const val = parseInt(slider.value);
                (this.state as any)[prop] = val;

                if (pill && formatLabel) {
                    this.setPill(slider, pill, formatLabel(val));
                }

                // Interaction always enables the filter
                if (!this.state.enabled) {
                    this.state.enabled = true;
                }

                // Auto-switch to Custom if dragging slider
                if (this.state.profileId !== 'custom') {
                    this.state.profileId = 'custom';
                    this.updateActiveButton(); // Only visual update
                }

                // Apply logic
                this.broadcast();
                this.save();
            });
        }
    }

    private setPill(range: HTMLInputElement, pill: HTMLElement, text: string) {
        const min = Number(range.min);
        const max = Number(range.max);
        const val = Number(range.value);
        const pct = (val - min) / (max - min);

        pill.textContent = text;

        // Adjusted for standard thumb width approx 16px
        // Center: 8px + pct * (100% - 16px)
        pill.style.left = `calc(${pct * 100}% + ${8 - pct * 16}px)`;
    }

    private setupPresetButtons() {
        document.querySelectorAll('.care-mode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const profile = target.dataset.profile as DisplayProfileId;
                if (profile) {
                    this.applyPreset(profile);
                }
            });
        });
    }

    private applyPreset(id: DisplayProfileId) {
        // Special case: 'pause' means DISABLED
        if (id === 'pause') {
            this.state.enabled = false;
            this.state.profileId = 'pause';
            this.save();
            this.broadcast();
            this.syncUI();
            return;
        }

        const preset = DISPLAY_PRESETS[id];
        if (!preset) return;

        this.state = {
            ...this.state,
            ...preset,
            profileId: id,
            enabled: true // Force enable when selecting any preset
        };

        // If preset didn't specify advanced, revert to defaults
        if (preset.contrastPct === undefined) this.state.contrastPct = 100;
        if (preset.saturationPct === undefined) this.state.saturationPct = 100;
        // Fix: Reset flags to avoid state bleed
        if (preset.invert === undefined) this.state.invert = false;
        if (preset.grayscale === undefined) this.state.grayscale = false;

        this.save();
        this.broadcast();
        this.syncUI();
        this.updateActiveButton();
        this.updateDescription();
    }

    private syncUI() {
        // Sliders
        this.setSliderVal('slider-warmth', this.state.warmthK, (v) => `${v}K`);
        this.setSliderVal('slider-brightness', this.state.brightnessPct, (v) => `${v}%`);

        // Active Button
        this.updateActiveButton();

        // Description
        this.updateDescription();
    }

    private setSliderVal(id: string, val: number | undefined, fmt: (v: number) => string) {
        if (val === undefined) return;
        const slider = document.getElementById(id) as HTMLInputElement;
        const pill = document.getElementById(`${id}-pill`);

        if (slider) {
            slider.value = val.toString();
            if (pill) this.setPill(slider, pill, fmt(val));
        }
    }

    private updateActiveButton() {
        document.querySelectorAll('.care-mode').forEach(btn => btn.classList.remove('active'));
        if (this.state.profileId) {
            const btn = document.querySelector(`.care-mode[data-profile="${this.state.profileId}"]`);
            if (btn) btn.classList.add('active');
        }
    }

    private updateDescription() {
        const descEl = document.getElementById('display-mode-desc');
        if (descEl) {
            const preset = DISPLAY_PRESETS[this.state.profileId];
            descEl.innerText = preset?.description || "";
        }
    }
}
