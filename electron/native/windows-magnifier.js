let koffi = null;
try {
    koffi = require('koffi');
} catch (e) {
    console.error('[WindowsMagnifier] Failed to load koffi module. Native features will be disabled.', e);
}

let lib = null;
let MagInitialize = null;
let MagUninitialize = null;
let MagSetFullscreenColorEffect = null;
let isInitialized = false;

// 5x5 Matrix (array of 25 floats)
// Row-major order in documentation? 
// MAGCOLOREFFECT is "The transformation matrix".
// Structure is 5x5 float.

if (koffi) {
    try {
        lib = koffi.load('Magnification.dll');

        // Define Types
        const MAGCOLOREFFECT = koffi.struct('MAGCOLOREFFECT', {
            transform: koffi.array('float', 25)
        });

        // Define Functions
        // Note: Koffi doesn't support SAL annotations like _In_ directly in strings if not configured.
        // We use the struct pointer type defined above.
        MagInitialize = lib.func('__stdcall', 'MagInitialize', 'bool', []);
        MagUninitialize = lib.func('__stdcall', 'MagUninitialize', 'bool', []);

        // Use the struct name defined above with a pointer
        MagSetFullscreenColorEffect = lib.func('__stdcall', 'MagSetFullscreenColorEffect', 'bool', ['MAGCOLOREFFECT *']);
    } catch (e) {
        console.warn('[WindowsMagnifier] Failed to load Magnification.dll (Not on Windows?):', e);
    }
}

// Matrices
const MATRIX_IDENTITY = [
    1.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 1.0
];

// Grayscale (E-ink) from Microsoft Docs / User
const MATRIX_GRAYSCALE = [
    0.3, 0.3, 0.3, 0.0, 0.0,
    0.6, 0.6, 0.6, 0.0, 0.0,
    0.1, 0.1, 0.1, 0.0, 0.0,
    0.0, 0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 0.0, 1.0
];

// Invert from Microsoft Docs / User
const MATRIX_INVERT = [
    -1.0, 0.0, 0.0, 0.0, 0.0,
    0.0, -1.0, 0.0, 0.0, 0.0,
    0.0, 0.0, -1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 1.0, 0.0,
    1.0, 1.0, 1.0, 0.0, 1.0
];

function init() {
    if (!lib) return false;
    if (isInitialized) return true;
    try {
        const success = MagInitialize();
        console.log('[WindowsMagnifier] MagInitialize result:', success);
        if (success) isInitialized = true;
        return success;
    } catch (e) {
        console.error('[WindowsMagnifier] Init failed:', e);
        return false;
    }
}

function uninit() {
    if (!lib || !isInitialized) return;
    try {
        MagUninitialize();
        isInitialized = false;
    } catch (e) { console.error(e); }
}

function applyMatrix(matrix) {
    if (!lib) return false;
    if (!isInitialized) init();

    // Create struct instance
    // transformation is just an array of 25 floats
    // koffi handles array passing if we pass a JS array for the struct field?
    // Let's pass the object matching the struct
    const effect = {
        transform: matrix
    };

    try {
        const ret = MagSetFullscreenColorEffect(effect);
        console.log('[WindowsMagnifier] MagSetFullscreenColorEffect result:', ret);
        return ret;
    } catch (e) {
        console.error('[WindowsMagnifier] SetEffect failed:', e);
        return false;
    }
}

module.exports = {
    init,
    uninit,
    setGrayscale: () => applyMatrix(MATRIX_GRAYSCALE),
    setInvert: () => applyMatrix(MATRIX_INVERT),
    setIdentity: () => applyMatrix(MATRIX_IDENTITY)
};
