import React, {useState, useRef, useEffect} from 'react';
import axios from '../axiosInstance';
import './ChatArea.css';
import useAudioPlayer from '../hooks/useAudioPlayer';

function ChatArea({chatId, onWordClick, onSendMessage}) {
    const [tooltip, setTooltip] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [translateTooltip, setTranslateTooltip] = useState(null); // Tooltip cho bản dịch
    const tooltipRef = useRef(null); // Ref để tham chiếu vùng tooltip
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element

    // Lấy lịch sử chat từ backend khi chatId thay đổi
    useEffect(() => {
        const fetchHistory = async () => {
            if (!chatId) {
                setChatHistory([]);
                return;
            }
            try {
                const res = await axios.get(`/chats/${chatId}/history`);
                setChatHistory(res.data.history || []);
            } catch (err) {
                console.error('Error fetching history:', err);
                setChatHistory([]); // Xóa lịch sử khi không có chatId
            }
        };
        fetchHistory();
    }, [chatId]);

    // Cập nhật chatHistory khi có tin nhắn mới từ InputArea
    useEffect(() => {
        if (onSendMessage) {
            onSendMessage.current = (message) => {
                console.log('Received new message:', message);
                setChatHistory((prev) => {
                    // Thay thế tin nhắn tạm cuối cùng (ai: '...')
                    const lastIndex = prev.length - 1;
                    if (lastIndex >= 0 && prev[lastIndex].ai === '...') {
                        return [...prev.slice(0, lastIndex), message];
                    }
                    // Nếu không, thêm mới (trường hợp tin nhắn đầu tiên)
                    return [...prev, message];
                });
            };
        }
    }, [onSendMessage]);

    // Loại bỏ dấu câu ở đầu và cuối từ
    const cleanWord = (word) => {
        return word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
    };

    // Xử lý double-click từ
    const handleWordClick = async (word, event) => {
        const cleanedWord = cleanWord(word);
        if (!cleanedWord) return;

        // Hiển thị tooltip ngay lập tức với trạng thái "Loading"
        setTooltip({
            word: cleanedWord,
            definition: 'Loading...',
            phonetic: 'Loading...',
            audio: 'Loading...',
            x: event.pageX,
            y: event.pageY,
        });
        try {
            const res = await axios.post(
                `/word-info`,
                {word: cleanedWord},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            setTooltip({
                word: cleanedWord,
                definition: res.data.definition || 'No definition found',
                phonetic: res.data.phonetic || 'N/A',
                audio: res.data.audio || '',
                x: event.pageX,
                y: event.pageY,
            });
            onWordClick(cleanedWord, event); // Callback để InputArea xử lý thêm nếu cần
        } catch (err) {
            console.error('Error fetching word info:', err.response?.data || err.message);
            setTooltip({
                word: cleanedWord,
                definition: 'Failed to fetch info',
                phonetic: 'N/A',
                audio: '',
                x: event.pageX,
                y: event.pageY,
            });
        }
    };

    const handlePlay = async (audioUrl, text, index) => {
        if (isPlaying) return;
        setIsPlaying(true);
        try {
            if (audioUrl) {
                await playSound({audioUrl});
            } else if (text) {
                console.log('No audio URL/path, generating from text:', text);
                console.log('chatId before playSound:', chatId);
                if (!chatId) {
                    console.warn('chatId is undefined, skipping database update');
                }
                await playSound({word: text, chatId: chatId || '', index});
            }
        } catch (err) {
            console.error('Error playing audio:', err);
        } finally {
            setIsPlaying(false);
        }
    };

    const handleTranslate = async (text, event) => {
        try {
            const res = await axios.post(
                `/translate`,
                {text: text, target_lang: 'vi'},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log('Translate response:', res.data);
            setTranslateTooltip({text: res.data.translatedText, x: event.pageX, y: event.pageY});
        } catch (err) {
            console.error('Error translating:', err);
            setTranslateTooltip({text: 'Failed to translate', x: event.pageX, y: event.pageY});
        }
    };

    const addToVocab = async () => {
        if (!tooltip || !chatId) return;
        try {
            await axios.post(
                `/add-vocab`,
                {...tooltip, chat_id: chatId},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(`Added ${tooltip.word} to vocab`);
            // setTooltip(null); // Tắt tooltip
        } catch (err) {
            console.error('Error adding to vocab:', err.response?.data || err.message);
        }
    };

    // Đóng tooltip khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setTooltip(null);
                setTranslateTooltip(null);
            }
        };

        if (tooltip || translateTooltip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup sự kiện khi tooltip bị tắt hoặc component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tooltip, translateTooltip]); // Chạy lại khi tooltip thay đổi

    return (
        <main className="chat-area">
            {chatHistory.length > 0 ? (
                chatHistory.map((msg, index) => (
                    <div key={index} className="message-group">
                        <div className="message user">
                            {(msg.user || '').split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))}
                        </div>
                        <div className="message system">
                            {(msg.ai || '').split(' ').map((word, i) => (
                                <span key={i} onDoubleClick={(e) => handleWordClick(word, e)}>
                                    {word}&nbsp;
                                </span>
                            ))}
                            {msg.ai && (
                                <>
                                    <button onClick={() => handlePlay(msg.audioUrl, msg.ai, index)}>Play</button>
                                    <button onClick={(e) => handleTranslate(msg.ai, e)}>Translate</button>
                                </>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p>No chat history available</p>
            )}
            {tooltip && (
                <div
                    ref={tooltipRef} // Gán ref cho vùng tooltip
                    className="tooltip"
                    style={{top: tooltip.y + 30, left: tooltip.x, position: 'absolute'}}
                >
                    <p>
                        <strong>{tooltip.word}</strong>
                    </p>
                    <p>{tooltip.definition}</p>
                    <p>{tooltip.phonetic}</p>
                    <button onClick={() => playSound({audioUrl: tooltip.audio, word: tooltip.word, ttsMethod: 'gtts'})}>
                        Play
                    </button>
                    <button onClick={addToVocab} disabled={tooltip.phonetic == 'N/A'}>
                        Add to vocab
                    </button>
                </div>
            )}
            {translateTooltip && (
                <div
                    ref={tooltipRef} // Gán ref cho vùng translateTooltip
                    className="tooltip"
                    style={{top: translateTooltip.y + 30, left: translateTooltip.x, position: 'absolute'}}
                >
                    <p>{translateTooltip.text}</p>
                </div>
            )}
            <audio ref={audioRef} style={{display: 'none'}}></audio>
        </main>
    );
}

export default ChatArea;
