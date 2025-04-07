// components/ChatArea.jsx
import React, {useState, useEffect} from 'react';
import axios from '../axiosInstance';
import useAudioPlayer from '../hooks/useAudioPlayer';
import useSiteConfig from '../hooks/useSiteConfig';
import useUserInfo from '../hooks/useUserInfo';
import useKTTooltip from '../hooks/useKTTooltip.js';
import {getAvatarInitial} from '../utils/avatarUtils';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify

import {Tooltip as MuiTooltip} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

function ChatArea({userEmail, chatId, onWordClick, onSendMessage, onVocabAdded}) {
    const {config, loading: configLoading, error: configError} = useSiteConfig(); // Lấy config từ backend
    const {userInfo, loading: userLoading, error: userError} = useUserInfo(userEmail); // Hook lấy thông tin user
    const [chatHistory, setChatHistory] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element
    const {
        wordTooltip,
        wordTooltipRef,
        translateTooltip,
        translateTooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
        handleTranslate,
    } = useKTTooltip({
        chatId,
        onVocabAdded,
        dictionarySource: 'dictionaryapi',
    });

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

    // Phát âm thanh
    const handlePlayMessage = async (audioUrl, text, index) => {
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
            toast.error('Failed to play audio');
        } finally {
            setIsPlaying(false);
        }
    };

    // Xử lý config
    if (configLoading || userLoading) {
        return <CircularProgress />;
    }
    if (configError || userError) {
        return (
            <Alert severity="error">
                {configError}
                {userError}
            </Alert>
        );
    }

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
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: 'white',
                                                    },
                                                }}
                                            >
                                                {word}&nbsp;
                                            </Typography>
                                        ))}
                                    </Box>

                                    {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                                    <Avatar
                                        alt="User Avatar"
                                        src={userInfo?.avatarPath || ''}
                                        sx={{bgcolor: 'primary.main', width: 40, height: 40}}
                                    >
                                        {userInfo && !userInfo.avatarPath ? getAvatarInitial(userInfo) : null}
                                    </Avatar>
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
                                        src={config?.aiChatIcon || null}
                                        alt="AI Icon"
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
                                        {/* \s: Khoảng trắng (space, tab)
                                            \n: Ký tự xuống dòng
                                            +: Match 1 hoặc nhiều lần */}
                                        {(msg.ai || '').split(/[\s\n]+/).map((word, i) => (
                                            <Typography
                                                key={i}
                                                variant="body1"
                                                component="span"
                                                noWrap
                                                onDoubleClick={(e) => handleWordClick(word, e)}
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: 'grey.300',
                                                    },
                                                }}
                                            >
                                                {word}&nbsp;
                                            </Typography>
                                        ))}

                                        {/* Nút phát âm thanh và dịch */}
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
                                                    onClick={() => handlePlayMessage(msg.audioUrl, msg.ai, index)}
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
                                                    onClick={(e) => handleTranslate(msg.ai, index, e)}
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
                                {/* Logo */}
                                <Box
                                    sx={{
                                        backgroundImage: config?.logoImage ? `url("${config.logoImage}")` : null,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
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
            {wordTooltip && (
                <MuiTooltip
                    open
                    title={
                        <div
                            ref={wordTooltipRef} // Gắn ref cho vùng tooltip
                        >
                            <Box sx={{p: 1}}>
                                <Typography variant="subtitle1" sx={{fontSize: '1.2rem', textTransform: 'capitalize'}}>
                                    <strong>{wordTooltip.word}</strong>
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '.95rem',
                                        mt: 1,
                                    }}
                                >
                                    {wordTooltip.definition}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '.95rem',
                                        my: 1,
                                    }}
                                >
                                    {wordTooltip.phonetic}
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
                                        onClick={() => handlePlay(wordTooltip.audio, wordTooltip.word)}
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
                                        onClick={handleAddToVocab}
                                        disabled={wordTooltip.definition == 'N/A'}
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
                                top: wordTooltip.y,
                                left: wordTooltip.x,
                                right: wordTooltip.x,
                                bottom: wordTooltip.y,
                                width: 0,
                                height: 0,
                            }),
                        },
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: wordTooltip.y + 20,
                            left: wordTooltip.x,
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
                            ref={translateTooltipRef} // Gán ref cho vùng translateTooltip
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
            <ToastContainer position="bottom-left" autoClose={2500} />
        </>
    );
}

export default ChatArea;
