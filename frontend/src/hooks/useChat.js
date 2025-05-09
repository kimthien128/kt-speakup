// src/hooks/useChat.js
// hook để quản lý lịch sử chat, trạng thái phát âm, và xử lý tin nhắn

import {useState, useEffect, useCallback, useRef} from 'react';
import {toast} from 'react-toastify';
import {getChatHistory, updateAudioUrl} from '../services/chatsService';
import {logger} from '../utils/logger';

export const useChat = (chatId, onSendMessage) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSending, setIsSending] = useState(false); // Trạng thái gửi tin nhắn
    const [error, setError] = useState(null);
    const pendingResponseRef = useRef(false);

    // Hàm fetch lịch sử chat
    const fetchHistory = useCallback(async () => {
        if (!chatId || typeof chatId !== 'string') {
            return;
        }

        try {
            const history = await getChatHistory(chatId);

            // KHÔNG cập nhật nếu đang chờ phản hồi
            if (!pendingResponseRef.current) {
                setChatHistory(Array.isArray(history) ? history : []);
            }

            setError(null);
        } catch (err) {
            logger.error('Error fetching chat history:', err.message);
            setChatHistory([]);
            setError('Failed to load chat history');
        }
    }, [chatId]);

    // Luôn fetch khi chatId thay đổi
    useEffect(() => {
        fetchHistory();
    }, [chatId, fetchHistory]);

    // Cập nhật chatHistory khi có tin nhắn mới
    useEffect(() => {
        if (onSendMessage) {
            onSendMessage.current = (message, sending = false) => {
                setIsSending(sending); // Cập nhật isSending từ onSendMessage
                pendingResponseRef.current = sending; // Cập nhật ref

                setChatHistory((prev) => {
                    // Thay thế tin nhắn tạm cuối cùng (ai: '...')
                    const lastIndex = prev.length - 1;
                    if (lastIndex >= 0 && prev[lastIndex].ai === '...') {
                        return [...prev.slice(0, lastIndex), {...message}]; // Tạo object mới
                    }
                    return [...prev, {...message}]; // Tạo object mới để chatHistory nhận biết có thay đổi để cuộn xuống cuối
                });
                // Sau khi nhận phản hồi thực, cho phép fetch lịch sử
                if (!sending) {
                    pendingResponseRef.current = false;
                    // Fetch lại sau khi nhận phản hồi để đồng bộ
                    setTimeout(() => fetchHistory(), 300);
                }
            };
        }
    }, [onSendMessage, fetchHistory]);

    //hàm phụ cho PlayMessage
    const playAudioFromUrl = async (playSound, audioUrl) => {
        try {
            await playSound({audioUrl});
            return true;
        } catch (err) {
            logger.warn(`Failed to play audioUrl: ${err.message}`);
            return false;
        }
    };
    const regenerateAudioAndUpdateUrl = async (playSound, text, chatId, index) => {
        if (!text) throw new Error('No text to regenerate audio');

        const newAudioUrl = await playSound({text});
        logger.info('Generated new audio URL:', newAudioUrl);
        if (chatId) {
            try {
                await updateAudioUrl(chatId, index, newAudioUrl);
                logger.info('Audio URL updated successfully');
            } catch (patchErr) {
                logger.error(`Failed to update audioUrl: ${patchErr.message}`);
            }
        } else {
            logger.warn('chatId is undefined, skipping audioUrl update');
        }

        return newAudioUrl;
    };
    const playMessage = async (audioUrl, text, index, playSound, chatId) => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            let success = false;
            if (audioUrl) {
                success = await playAudioFromUrl(playSound, audioUrl);
            }
            if (!success) {
                if (text) {
                    await regenerateAudioAndUpdateUrl(playSound, text, chatId, index);
                    fetchHistory(); //cập nhật lại UI để button nhận được link mới
                } else {
                    throw new Error('No audio URL and no text to play');
                }
            }
            setError(null);
        } catch (err) {
            logger.error(`Error playing audio: ${err.message}`);
            toast.error('Failed to play audio');
            setError('Failed to play audio');
        } finally {
            setIsPlaying(false);
        }
    };

    return {
        chatHistory,
        isPlaying,
        isSending, // Trả về isSending để sử dụng trong ChatArea
        error,
        playMessage,
    };
};
