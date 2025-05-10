// hooks/useSuggestions.js
// Quản lý gợi ý

import {useState} from 'react';
import {generateResponse} from '../services/generateService';
import {updateSuggestion, getChatInfo, updateAudioUrl as updateAudioUrlService} from '../services/chatsService';
import {translateText} from '../services/translateService';
import {logger} from '../utils/logger';

export const useSuggestions = (chatId, updateSuggestionData, generateMethod, ttsMethod, playSound) => {
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Lấy gợi ý từ AI
    const fetchSuggestions = async (baseText, currentChatId) => {
        const promt = `Suggest a natural and simple follow-up question or response to keep this daily English conversation going: "${baseText}"`;

        try {
            const latestSuggestion = await generateResponse({
                method: generateMethod,
                transcript: promt,
                chatId: currentChatId,
            });

            if (latestSuggestion) {
                // Lưu suggestion mới nhất vào database
                await updateSuggestion(currentChatId, {
                    latest_suggestion: latestSuggestion,
                    translate_suggestion: '',
                    suggestion_audio_url: '',
                });

                // Cập nhật state trong component cha
                updateSuggestionData({
                    latest_suggestion: latestSuggestion,
                    translate_suggestion: '',
                    suggestion_audio_url: '',
                });

                return latestSuggestion;
            }
        } catch (err) {
            logger.error('Suggestion error:', err);
        }
        return null;
    };

    // Phát âm thanh từ suggestion_audio_url
    const generateSuggestionsAudio = async (suggestion, currentChatId) => {
        if (isPlaying) return; // Ngăn chặn phát nhiều audio cùng lúc
        setIsPlaying(true);

        try {
            // Kiểm tra có suggestion_audio_url trên database chưa
            const chatResponse = await getChatInfo(currentChatId);
            let audioUrl = chatResponse.suggestion_audio_url;

            //Nếu đã có suggestion_audio_url, phát âm thanh trực tiếp
            if (audioUrl) {
                logger.info('Using existing suggestion audio URL:', audioUrl);
                await playSound({audioUrl});
            } else {
                //Nếu không có suggestion_audio_url thì nhờ playSound generate dùm và phát âm thanh đồng thời cập nhật vào database
                logger.info('Generating new suggestion audio...');
                //playSound có trả về url
                audioUrl = await playSound({
                    text: suggestion,
                    ttsMethod,
                });
                if (audioUrl) {
                    logger.info('Generated and updated suggestion audio URL:', audioUrl);
                    updateAudioUrl({chatId: currentChatId, audioUrl: audioUrl, updateSuggestionAudioUrl: true});
                }
            }
        } catch (err) {
            logger.error('Error generating suggestion audio:', err);
        } finally {
            setIsPlaying(false);
        }
    };

    // Cập nhật audioUrl trong database
    const updateAudioUrl = async ({chatId, index, audioUrl, updateSuggestionAudioUrl}) => {
        try {
            if (updateSuggestionAudioUrl && chatId) {
                await updateSuggestion(chatId, {
                    suggestion_audio_url: audioUrl,
                });
            } else if (chatId && index !== '') {
                await updateAudioUrlService(chatId, index, audioUrl);
            }
        } catch (err) {
            logger.error('Error updating audio URL:', err);
            throw err;
        }
    };

    // Hàm dịch suggestion và cập nhật translation trong database
    const translateSuggestion = async (suggestion, currentChatId, suggestionData) => {
        // Nếu đã có bản dịch, chỉ toggle hiển thị/ẩn
        if (suggestionData.translate_suggestion) {
            setShowTranslation(!showTranslation);
            return;
        }

        // Nếu chưa có bản dịch, gọi API để dịch
        setLoading(true);
        try {
            // Gọi endpoint /translate để dịch suggestion
            const translatedText = await translateText(suggestion);

            // Lưu bản dịch vào database
            if (suggestionData.translate_suggestion !== translatedText) {
                await updateSuggestion(currentChatId, {
                    translate_suggestion: translatedText,
                });
                // Cập nhật suggestionData qua callback từ ChatPage
                updateSuggestionData({translate_suggestion: translatedText});
            }
            setShowTranslation(true); // Hiển thị translation
        } catch (err) {
            logger.error('Error translating suggestion:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        suggestionsOpen,
        setSuggestionsOpen,
        showTranslation,
        setShowTranslation,
        loading,
        isPlaying,
        fetchSuggestions,
        generateSuggestionsAudio,
        translateSuggestion,
    };
};
