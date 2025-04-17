// hooks/useSuggestions.js
// Quản lý gợi ý

import {useState} from 'react';
import axios from '../axiosInstance';
import {logger} from '../utils/logger';

export const useSuggestions = (chatId, updateSuggestionData, generateMethod, ttsMethod, playSound) => {
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Lấy gợi ý từ AI
    const fetchSuggestions = async (baseText, currentChatId) => {
        const suggestionPrompts = [
            `Provide ONLY ONE direct follow-up question or response (without any introductory phrase) for this sentence: "${baseText}"`,
            // `Short next question after: "${baseText}"` // Tạm thời chỉ lấy 1 gợi ý
        ];
        const newSuggestions = [];
        for (const prompt of suggestionPrompts) {
            try {
                const res = await axios.post(
                    `/generate?method=${generateMethod}`,
                    {transcript: prompt, chat_id: currentChatId},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!res.data.error) {
                    newSuggestions.push(res.data.response);

                    // Lưu suggestion mới nhất vào database
                    if (newSuggestions.length > 0) {
                        const latestSuggestion = newSuggestions[0];
                        await axios.put(
                            `/chats/${currentChatId}/suggestion`,
                            {
                                latest_suggestion: latestSuggestion,
                                translate_suggestion: '',
                                suggestion_audio_url: '',
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                        updateSuggestionData({
                            latest_suggestion: latestSuggestion,
                            translate_suggestion: '',
                            suggestion_audio_url: '',
                        });
                    }
                }
            } catch (err) {
                logger.error('Suggestion error:', err);
            }
        }
        return newSuggestions[0] || null;
    };

    // Phát âm thanh từ suggestion_audio_url
    const generateSuggestionsAudio = async (suggestion, currentChatId) => {
        if (isPlaying) return; // Ngăn chặn phát nhiều audio cùng lúc
        setIsPlaying(true);

        try {
            // Kiểm tra có suggestion_audio_url trên database chưa
            const chatResponse = await axios.get(`/chats/${currentChatId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            let audioUrl = chatResponse.data.suggestion_audio_url;

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
                await axios.put(
                    `/chats/${chatId}/suggestion`,
                    {suggestion_audio_url: audioUrl},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                logger.info(`Updated suggestion_audio_url for chatId: ${chatId}`);
            } else if (chatId && index !== '') {
                await axios.patch(
                    `/chats/${chatId}/audioUrl`,
                    {index, audioUrl},
                    {headers: {'Content-Type': 'application/json'}}
                );
                logger.info(`Updated audioUrl for chatId: ${chatId}, index: ${index}`);
            }
        } catch (err) {
            logger.error('Error updating audio URL:', err);
            throw err;
        }
    };

    // Hàm dịch suggestion và cập nhật translation trong database
    const translateSuggestion = async (suggestion, currentChatId, suggestionData) => {
        setLoading(true);
        try {
            // Nếu translation đã tồn tại và giống với giá trị hiện tại, không gọi API
            if (suggestionData.translate_suggestion && showTranslation) {
                setShowTranslation(false);
                return;
            }

            // Gọi endpoint /translate để dịch suggestion
            const translateResponse = await axios.post(
                `/translate`,
                {text: suggestion, target_lang: 'vi'},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const translatedText = translateResponse.data.translatedText;

            // Chir Cập nhật translation vào database neeus có thay đổi
            if (suggestionData.translate_suggestion !== translatedText) {
                await axios.put(
                    `/chats/${currentChatId}/suggestion`,
                    {
                        translate_suggestion: translatedText,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
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
