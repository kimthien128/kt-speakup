//services/ttsServices.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Tự generate audio từ text, trả về url đã upload lên bucket
export const getTTS = async ({method, text}) => {
    try {
        const response = await axios.post(
            `/tts?method=${method}`,
            {text},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.headers['x-audio-url']; // Trả về URL audio
    } catch (err) {
        logger.error('Error getting TTS:', err.response?.data || err.message);
        throw new Error('Failed to generate TTS');
    }
};
