// src/hooks/useChat.js
// hook để quản lý lịch sử chat, trạng thái phát âm, và xử lý tin nhắn. Hook này sẽ gọi chatService và useAudioPlayer

import {useState, useEffect, useCallback} from 'react';
import {toast} from 'react-toastify';
import {chatService} from '../services/chatService';
import {logger} from '../utils/logger';

export const useChat = (chatId, onSendMessage) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);

    // Hàm fetch lịch sử chat
    const fetchHistory = useCallback(async () => {
        // Kiểm tra chatId có hợp lệ không
        if (!chatId || typeof chatId !== 'string') {
            setChatHistory([]);
            setError('Invalid chat ID');
            logger.warn('Invalid chatId provided:', chatId);
            return;
        }

        try {
            const history = await chatService.fetchHistory(chatId);
            setChatHistory(history);
            setError(null);
        } catch (err) {
            setChatHistory([]);
            setError('Failed to load chat history');
        }
    }, [chatId]);

    // Fetch lịch sử khi chatId thay đổi
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Cập nhật chatHistory khi có tin nhắn mới
    useEffect(() => {
        if (onSendMessage) {
            onSendMessage.current = (message) => {
                setChatHistory((prev) => {
                    // Thay thế tin nhắn tạm cuối cùng (ai: '...')
                    const lastIndex = prev.length - 1;
                    if (lastIndex >= 0 && prev[lastIndex].ai === '...') {
                        return [...prev.slice(0, lastIndex), message];
                    }
                    return [...prev, message];
                });
            };
        }
    }, [onSendMessage]);

    /**
     * Phát âm thanh cho tin nhắn
     * @param {string} audioUrl - URL của file âm thanh
     * @param {string} text - Văn bản của tin nhắn
     * @param {number} index - Chỉ số của tin nhắn trong lịch sử chat
     * @param {Function} playSound - Hàm phát âm thanh từ useAudioPlayer
     * @param {string} chatId - ID của chat
     */
    const playMessage = async (audioUrl, text, index, playSound, chatId) => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            if (audioUrl) {
                await playSound({audioUrl});
            } else if (text) {
                logger.info(`No audio URL, generating from text: ${text}`);
                if (!chatId) {
                    logger.warn('chatId is undefined, skipping database update');
                }
                await playSound({word: text, chatId: chatId || '', index});
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
        error,
        playMessage,
    };
};
