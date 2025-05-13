//dictionaryService.js để sử dụng adapter phù hợp dựa trên nguồn từ điển. Nguồn từ điển có thể được cấu hình qua biến môi trường hoặc tham số.

import axios from '../axiosInstance';
import {logger} from '../utils/logger';

const DEFAULT_DICTIONARY_SOURCE = 'dictionaryapi'; // Nguồn từ điển mặc định

// Định nghĩa cấu trúc phản hồi mặc định
const DEFAULT_RESPONSE = {
    definition: 'No definition found',
    phonetic: 'N/A',
    audio: [],
    examples: [],
    pronunciations: [],
};

// Lấy thông tin từ vựng từ API
export const fetchWordInfo = async (word, source = DEFAULT_DICTIONARY_SOURCE, limit = 2) => {
    if (!word || typeof word !== 'string') {
        throw new Error('Word must be a non-empty string');
    }

    logger.info(`Fetching word info for word: ${word}, source: ${source}`);

    try {
        const response = await axios.post(
            `/word-info`,
            {word, source, limit}, // Truyền source vào body để backend biết gọi API nào
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        logger.info('Response from API:', response.data);
        if (!response.data || typeof response.data !== 'object') {
            logger.error('Invalid response format from API');
            throw new Error('Invalid response format');
        }

        return {
            definition: response.data.definition || DEFAULT_RESPONSE.definition,
            phonetic: response.data.phonetic || DEFAULT_RESPONSE.phonetic,
            audio: Array.isArray(response.data.audio) ? response.data.audio : DEFAULT_RESPONSE.audio,
            examples: Array.isArray(response.data.examples) ? response.data.examples : DEFAULT_RESPONSE.examples,
            pronunciations: Array.isArray(response.data.pronunciations)
                ? response.data.pronunciations
                : DEFAULT_RESPONSE.pronunciations,
        };
    } catch (error) {
        logger.error(`Error fetching word info for ${word}: ${error.message}`);
        throw error;
    }
};
