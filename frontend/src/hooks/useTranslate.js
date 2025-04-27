//hooks/useTranslate.js
// hàm xử lý dịch văn bản bất kỳ

import {useState, useCallback} from 'react';
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

const useTranslate = () => {
    const [translatedText, setTranslatedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const translateText = useCallback(async (text, targetLang = 'vi') => {
        // Kiểm tra nếu text là undefined, null, hoặc chuỗi rỗng
        if (typeof text !== 'string' || !text || text.trim() === '') {
            setTranslatedText('');
            setError('Missing or empty text');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            logger.info(`Translating text: "${text}" to targetLang: ${targetLang}`);
            const res = await axios.post(
                `/translate`,
                {text, target_lang: targetLang},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            logger.info('Translation response:', res.data);
            const result = res.data.translatedText || 'Translation not available';
            setTranslatedText(result);
            return result;
        } catch (err) {
            logger.error('Error translating:', err.response?.data || err.message);
            setError('Failed to translate: ' + (err.response?.data?.detail || err.message));
            setTranslatedText('');
            return '';
        } finally {
            setLoading(false);
        }
    }, []);

    return {translatedText, loading, error, translateText};
};
export default useTranslate;
