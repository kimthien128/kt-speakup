import React, {useState, useRef, useEffect} from 'react';
import axios from '../axiosInstance';
import {toast, ToastContainer} from 'react-toastify';
import useAudioPlayer from '../hooks/useAudioPlayer';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify
import {Tooltip as MuiTooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

function ChatArea({chatId, onWordClick, onSendMessage, onVocabAdded}) {
    const [tooltip, setTooltip] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [translateTooltip, setTranslateTooltip] = useState(null); // Tooltip cho bản dịch
    const tooltipRef = useRef(null); // Ref để tham chiếu vùng tooltip
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element

    //text avatar
    const userAvatar = 'https://marketplace.canva.com/EAGD_ug6bbY/1/0/1600w/canva-PXPfiI0IpT4.jpg';
    const aiAvatar = 'https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg';

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
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target) &&
                !event.target.closest('.MuiTooltip-popper') // kiểm tra phần tử tooltip của MUI
            ) {
                setTooltip(null);
                setTranslateTooltip(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup sự kiện khi tooltip bị tắt hoặc component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [tooltip, translateTooltip]); // Chạy lại khi tooltip thay đổi

    return (
        <>
            {/* Nội dung chat */}
            <Box
                sx={{
                    p: 2,
                    maxWidth: '900px',
                    display: 'flex',
                    margin: '0 auto',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflowY: 'auto', // Cuộn nội dung bên trong ChatArea
                }}
            >
                {chatHistory.length > 0 ? (
                    chatHistory.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                mt: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                            }}
                        >
                            {/* Tin nhắn người dùng */}
                            {msg.user && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 1.5,
                                            py: 2.5,
                                            bgcolor: 'rgba(0, 0, 0, 0.08)',
                                            borderRadius: 2,
                                            borderBottomRightRadius: 0,
                                            maxWidth: '70%',
                                            wordBreak: 'break-word',
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
                                    <Avatar
                                        src={userAvatar}
                                        alt="User Avatar"
                                        sx={{
                                            width: 40,
                                            height: 40,
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Tin nhắn AI */}
                            {msg.ai && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Avatar
                                        src={aiAvatar}
                                        alt="AI Avatar"
                                        sx={{
                                            width: 40,
                                            height: 40,
                                        }}
                                    />

                                    <Box
                                        sx={{
                                            px: 1.5,
                                            py: 2.5,
                                            bgcolor: 'rgba(66, 165, 245, .5)',
                                            borderRadius: 2,
                                            borderBottomLeftRadius: 0,
                                            width: 'fit-content',
                                            maxWidth: '70%',
                                            wordBreak: 'break-word',
                                            position: 'relative',
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
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 4,
                                                    transform: 'translateY(50%)',
                                                    display: 'flex',
                                                    gap: 1,
                                                    p: 1,
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handlePlay(msg.audioUrl, msg.ai, index)}
                                                    sx={{
                                                        bgcolor: 'rgba(66, 165, 245, .95)',
                                                        color: 'white',
                                                        '&: hover': {
                                                            bgcolor: 'primary.dark',
                                                        },
                                                    }}
                                                >
                                                    <VolumeUpIcon fontSize="small" />
                                                </IconButton>

                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleTranslate(msg.ai, e)}
                                                    sx={{
                                                        bgcolor: 'rgba(66, 165, 245, .95)',
                                                        color: 'white',
                                                        '&: hover': {
                                                            bgcolor: 'primary.dark',
                                                        },
                                                    }}
                                                >
                                                    <TranslateIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ))
                ) : (
                    <Box
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                textAlign: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundImage:
                                            'url("https://marketplace.canva.com/EAGD_ug6bbY/1/0/1600w/canva-PXPfiI0IpT4.jpg")',
                                        backgroundSize: 'cover',
                                        width: '80px',
                                        height: '80px',
                                        mr: 2,
                                    }}
                                ></Box>
                                <Typography variant="h4">Hi, I'm KT SpeakUp.</Typography>
                            </Box>
                            <Typography variant="h6">What are we talking about today?</Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Tooltip cho từ vựng*/}
            {tooltip && (
                <MuiTooltip
                    open
                    title={
                        <div
                            ref={tooltipRef} // Gán ref cho vùng tooltip
                        >
                            <Box sx={{p: 1}}>
                                <Typography variant="subtitle1" sx={{fontSize: '1.2rem', textTransform: 'capitalize'}}>
                                    <strong>{tooltip.word}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '.95rem',
                                        mt: 1,
                                    }}
                                >
                                    {tooltip.definition}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '.95rem',
                                        my: 1,
                                    }}
                                >
                                    {tooltip.phonetic}
                                </Typography>

                                {/* Button phất âm và Add to vocab */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<VolumeUpIcon fontSize="small" />}
                                        onClick={() =>
                                            playSound({audioUrl: tooltip.audio, word: tooltip.word, ttsMethod: 'gtts'})
                                        }
                                        sx={{
                                            textTransform: 'none',
                                            color: 'text.secondary',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderColor: 'text.secondary',
                                            },
                                        }}
                                    >
                                        Pronounce
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<BookmarkAddIcon fontSize="small" />}
                                        onClick={addToVocab}
                                        disabled={tooltip.phonetic == 'N/A'}
                                        sx={{
                                            textTransform: 'none',
                                            color: 'text.secondary',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                                borderColor: 'text.secondary',
                                            },
                                            '&.Mui-disabled': {
                                                opacity: 0.5,
                                            },
                                        }}
                                    >
                                        Add to vocab
                                    </Button>
                                </Box>
                            </Box>
                        </div>
                    }
                    placement="bottom-start"
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: 'white',
                                color: 'text.primary',
                                p: 2,
                                fontSize: '1.4rem', //kích thước arrow
                                maxWidth: 400,
                                boxShadow: '0px 2px 10px rgba(0,0,0,0.3)',
                                borderRadius: 2,
                            },
                        },
                    }}
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
                        sx={{
                            position: 'absolute',
                            top: tooltip.y + 20,
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
                    title={
                        <div
                            ref={tooltipRef} // Gán ref cho vùng translateTooltip
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '.95rem',
                                }}
                            >
                                {translateTooltip.text}
                            </Typography>
                        </div>
                    }
                    placement="bottom-start"
                    componentsProps={{
                        tooltip: {
                            sx: {
                                bgcolor: 'white',
                                color: 'text.primary',
                                p: 2,
                                fontSize: '1.4rem', //kích thước arrow
                                maxWidth: 300,
                                boxShadow: '0px 2px 10px rgba(0,0,0,0.3)',
                                borderRadius: 2,
                            },
                        },
                    }}
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
                        sx={{
                            position: 'absolute',
                            top: translateTooltip.y + 20,
                            left: translateTooltip.x,
                            zIndex: 99,
                        }}
                    ></Box>
                </MuiTooltip>
            )}

            <audio ref={audioRef} style={{display: 'none'}}></audio>
            <ToastContainer position="bottom-left" autoClose={2800} />
        </>
    );
}

export default ChatArea;
