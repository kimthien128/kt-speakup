import React, {useState, useRef, useEffect} from 'react';
import axios from '../axiosInstance';
import {toast, ToastContainer} from 'react-toastify';
import useAudioPlayer from '../hooks/useAudioPlayer';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify
import {Box, Typography, Button, Tooltip as MuiTooltip} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

function ChatArea({chatId, onWordClick, onSendMessage, onVocabAdded}) {
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
                `/vocab`,
                {...tooltip, chat_id: chatId},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            toast.success(`Added ${tooltip.word} to vocab`);
            if (onVocabAdded && onVocabAdded.current) {
                onVocabAdded.current(); // Gọi hàm refresh từ RightSidebar
            }
        } catch (err) {
            if (err.response && err.response.status === 400) {
                toast.warn(err.response.data.detail);
            } else {
                console.error('Error adding to vocab:', err.response?.data || err.message);
                toast.error('Failed to add to vocab');
            }
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
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Nội dung chat */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    p: 2,
                }}
            >
                {chatHistory.length > 0 ? (
                    chatHistory.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                mb: 2,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Tin nhắn người dùng */}
                            {msg.user && (
                                <Box
                                    sx={{
                                        p: 1,
                                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                                        borderRadius: 2,
                                        maxWidth: '70%',
                                        wordBreak: 'break-word',
                                        textAlign: 'right',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {(msg.user || '').split(' ').map((word, i) => (
                                        <Typography
                                            key={i}
                                            variant="body1"
                                            component="span"
                                            noWrap
                                            onDoubleClick={(e) => handleWordClick(word, e)}
                                        >
                                            {word}&nbsp;
                                        </Typography>
                                    ))}
                                </Box>
                            )}

                            {/* Tin nhắn AI */}
                            {msg.ai && (
                                <Box
                                    sx={{
                                        p: 1,
                                        bgcolor: 'primary.light',
                                        borderRadius: 2,
                                        width: 'fit-content',
                                        maxWidth: '70%',
                                        wordBreak: 'break-word',
                                        mt: msg.user ? 1 : 0,
                                    }}
                                >
                                    {(msg.ai || '').split(' ').map((word, i) => (
                                        <Typography
                                            key={i}
                                            variant="body1"
                                            component="span"
                                            noWrap
                                            onDoubleClick={(e) => handleWordClick(word, e)}
                                        >
                                            {word}&nbsp;
                                        </Typography>
                                    ))}
                                    {msg.ai && msg.ai != '...' && (
                                        <Box sx={{mt: 1}}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{mr: 1}}
                                                onClick={() => handlePlay(msg.audioUrl, msg.ai, index)}
                                            >
                                                Play
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={(e) => handleTranslate(msg.ai, e)}
                                            >
                                                Translate
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    ))
                ) : (
                    <p>No chat history available</p>
                )}
            </Box>

            {/* Tooltip cho từ vựng*/}
            {tooltip && (
                <MuiTooltip
                    open
                    title={
                        <Box sx={{p: 1}}>
                            <Typography variant="subtitle1">
                                <strong>{tooltip.word}</strong>
                            </Typography>
                            <Typography variant="body2">{tooltip.definition}</Typography>
                            <Typography variant="body2">{tooltip.phonetic}</Typography>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() =>
                                    playSound({audioUrl: tooltip.audio, word: tooltip.word, ttsMethod: 'gtts'})
                                }
                                sx={{mt: 1, mr: 1}}
                            >
                                Play
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={addToVocab}
                                disabled={tooltip.phonetic == 'N/A'}
                                sx={{mt: 1}}
                            >
                                Add to vocab
                            </Button>
                        </Box>
                    }
                    placement="bottom-start"
                    PopperProps={{
                        anchorEl: {
                            getBoundingClientRect: () => ({
                                top: tooltip.y,
                                left: tooltip.x,
                                right: tooltip.x,
                                bottom: tooltip.y,
                                width: 0,
                                height: 0,
                            }),
                        },
                    }}
                >
                    <Box
                        ref={tooltipRef} // Gán ref cho vùng tooltip
                        sx={{
                            position: 'absolute',
                            top: tooltip.y + 30,
                            left: tooltip.x,
                            zIndex: 999,
                        }}
                    ></Box>
                </MuiTooltip>
            )}

            {/* Tooltip cho dịch */}
            {translateTooltip && (
                <MuiTooltip
                    open
                    title={<Typography variant="body2">{translateTooltip.text}</Typography>}
                    placement="bottom-start"
                    PopperProps={{
                        anchorEl: {
                            getBoundingClientRect: () => ({
                                top: translateTooltip.y,
                                left: translateTooltip.x,
                                right: translateTooltip.x,
                                bottom: translateTooltip.y,
                                width: 0,
                                height: 0,
                            }),
                        },
                    }}
                >
                    <Box
                        ref={tooltipRef} // Gán ref cho vùng translateTooltip
                        sx={{
                            position: 'absolute',
                            top: translateTooltip.y + 30,
                            left: translateTooltip.x,
                            zIndex: 999,
                        }}
                    ></Box>
                </MuiTooltip>
            )}

            <audio ref={audioRef} style={{display: 'none'}}></audio>
            <ToastContainer position="bottom-left" autoClose={3000} />
        </Box>
    );
}

export default ChatArea;
