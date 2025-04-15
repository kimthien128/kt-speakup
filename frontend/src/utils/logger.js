// src/utils/logger.js
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    info: (...args) => {
        if (isDev) {
            console.log('[INFO]', ...args);
        }
    },
    error: (...args) => {
        if (isDev) {
            console.error('[ERROR]', ...args);
        }
    },
    warn: (...args) => {
        if (isDev) {
            console.warn('[WARN]', ...args);
        }
    },
};
