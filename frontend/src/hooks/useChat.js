// src/hooks/useChat.js
// hook để quản lý lịch sử chat, trạng thái phát âm, và xử lý tin nhắn. Hook này sẽ gọi chatService và useAudioPlayer

import {useState, useEffect, useCallback} from 'react';
import {toast} from 'react-toastify';
import {chatService} from '../services/chatService';
import {logger} from '../utils/logger';

export const useChat = (chatId, onSendMessage) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSending, setIsSending] = useState(false); // Trạng thái gửi tin nhắn
    const [error, setError] = useState(null);

    // Hàm fetch lịch sử chat
    const fetchHistory = useCallback(async () => {
        if (!chatId || typeof chatId !== 'string') {
            return;
        }

        try {
            const history = await chatService.fetchHistory(chatId);
            // So sánh history từ server với chatHistory hiện tại
            setChatHistory((prev) => {
                // Đảm bảo history là mảng trước khi cập nhật
                const newHistory = Array.isArray(history) ? history : [];
                if (JSON.stringify(prev) === JSON.stringify(newHistory)) {
                    return prev; // Không cập nhật nếu không có thay đổi
                }
                return [...newHistory]; // Luôn tạo mảng mới
            });
            setError(null);
        } catch (err) {
            setChatHistory([]);
            setError('Failed to load chat history');
        }
    }, [chatId]);

    // Fetch lịch sử khi chatId thay đổi, và fetch lịch sử khi chatId hợp lệ
    useEffect(() => {
        if (!chatId || typeof chatId !== 'string') {
            setChatHistory([]); // Reset chatHistory khi chatId không hợp lệ (tại / hoặc /chat)
            return;
        }
        fetchHistory(); // Gọi fetchHistory khi chatId hợp lệ
    }, [fetchHistory, chatId]);

    // Cập nhật chatHistory khi có tin nhắn mới
    useEffect(() => {
        if (onSendMessage) {
            onSendMessage.current = (message, sending = false) => {
                setIsSending(sending); // Cập nhật isSending từ onSendMessage
                setChatHistory((prev) => {
                    // Thay thế tin nhắn tạm cuối cùng (ai: '...')
                    const lastIndex = prev.length - 1;
                    if (lastIndex >= 0 && prev[lastIndex].ai === '...') {
                        return [...prev.slice(0, lastIndex), {...message}]; // Tạo object mới
                    }
                    return [...prev, {...message}]; // Tạo object mới để chatHistory nhận biết có thay đổi để cuộn xuống cuối
                });
            };
        }
    }, [onSendMessage]);

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
                await playSound({text: text, chatId: chatId || '', index});
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
