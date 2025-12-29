/**
 * JAX-JS Initialization Module
 * 
 * Shared initialization for all visualizations that use jax-js.
 * Provides GPU-accelerated array operations for scientific computing.
 */

// Singleton for jax-js module
let jaxInstance = null;
let jaxInitPromise = null;
let deviceType = 'wasm';

/**
 * Initialize jax-js and return the module.
 * Returns a promise that resolves to the jax module or null if unavailable.
 */
export async function initJax() {
    if (jaxInstance) return jaxInstance;
    if (jaxInitPromise) return jaxInitPromise;

    jaxInitPromise = (async () => {
        try {
            const jax = await import('https://esm.sh/@jax-js/jax');
            const devices = await jax.init();

            if (devices.includes('webgpu')) {
                jax.defaultDevice('webgpu');
                deviceType = 'webgpu';
                console.log('JAX-JS: Using WebGPU acceleration');
            } else if (devices.includes('wasm')) {
                jax.defaultDevice('wasm');
                deviceType = 'wasm';
                console.log('JAX-JS: Using WebAssembly');
            }

            jaxInstance = jax;
            return jax;
        } catch (e) {
            console.warn('JAX-JS initialization failed:', e);
            return null;
        }
    })();

    return jaxInitPromise;
}

/**
 * Get the current device type ('webgpu', 'wasm', or 'cpu')
 */
export function getDeviceType() {
    return deviceType;
}

/**
 * Check if jax-js is available
 */
export function isJaxReady() {
    return jaxInstance !== null;
}

/**
 * Get the jax module (must be initialized first)
 */
export function getJax() {
    return jaxInstance;
}
