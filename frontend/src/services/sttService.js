//services/sttService.js

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

// Gửi audioBlob tới /stt để chuyển đổi thành văn bản
export const getSTT = async (audioBlob, method) => {
    try {
        const response = await axios.post(`/stt?method=${method}`, audioBlob, {
            headers: {
                'Content-Type': 'audio/webm',
            },
        });

        return {
            transcript: response.data.transcript || '',
            success: true,
        };
    } catch (err) {
        logger.error('Speech-to-text conversion error:', err.response?.data || err.message);
        return {
            transcript: '',
            success: false,
            error: err.response?.data?.detail || 'Failed to process audio',
        };
    }
};
