//dictionaryService.js để sử dụng adapter phù hợp dựa trên nguồn từ điển. Nguồn từ điển có thể được cấu hình qua biến môi trường hoặc tham số.

import axios from '../axiosInstance';

const DEFAULT_DICTIONARY_SOURCE = 'dictionaryapi'; // Nguồn từ điển mặc định

export const fetchWordInfo = async (word, source = DEFAULT_DICTIONARY_SOURCE, limit = 2) => {
    try {
        console.log(`Fetching word info for word: ${word}, source: ${source}`);

        const res = await axios.post(
            `/word-info`,
            {word, source, limit}, // Truyền source vào body để backend biết gọi API nào
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('API response:', res.data);

        if (!res.data || typeof res.data !== 'object') {
            return {definition: 'Failed to fetch info', phonetic: 'N/A', audio: ''};
        }

        return res.data;
    } catch (error) {
        console.error('Error in fetchWordInfo:', err.message);
        return {definition: 'Failed to fetch info', phonetic: 'N/A', audio: ''};
    }
};
