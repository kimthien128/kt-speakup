// components/ChatArea.jsx
import React, {useEffect, useRef} from 'react';
import {Tooltip as MuiTooltip, Tooltip} from '@mui/material';
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

import useAudioPlayer from '../hooks/useAudioPlayer';
import useSiteConfig from '../hooks/useSiteConfig';
import useUserInfo from '../hooks/useUserInfo';
import {useImageLoadStatus} from '../utils/imageLoader';
import {useWordTooltip} from '../hooks/useWordTooltip';
import {useTranslateTooltip} from '../hooks/useTranslateTooltip';
import {useClickOutside} from '../hooks/useClickOutside';
import {getAvatarInitial} from '../utils/avatarUtils';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify

import {useChat} from '../hooks/useChat';
import {useDictionary} from '../context/DictionaryContext';

function ChatArea({userEmail, chatId, onWordClick, onSendMessage, onVocabAdded}) {
    const {config, loading: configLoading, error: configError} = useSiteConfig(); // Lấy config từ backend
    const {userInfo, loading: userLoading, error: userError} = useUserInfo(userEmail); // Hook lấy thông tin user

    // Cấu hình các hình ảnh cần kiểm tra
    const imageConfigs = [
        {key: 'logoImage', url: config?.logoImage},
        {key: 'aiChatIcon', url: config?.aiChatIcon},
    ];
    // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
    const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

    const {playSound, audioRef} = useAudioPlayer(); // Ref để quản lý audio element
    const {dictionarySource} = useDictionary(); // Lấy nguồn từ điển từ context

    const {
        wordTooltip,
        setWordTooltip,
        wordTooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
        isPlaying: isPlayingWord,
        isLoading: isLoadingWord,
    } = useWordTooltip({chatId, onVocabAdded, dictionarySource}); // Hook quản lý tooltip từ vựng

    const {translateTooltip, setTranslateTooltip, translateTooltipRef, handleTranslate} = useTranslateTooltip({chatId}); // Hook quản lý tooltip dịch

    const {
        chatHistory,
        isPlaying: isPlayingChat,
        isSending,
        error: chatError,
        playMessage,
    } = useChat(chatId, onSendMessage); // Hook quản lý lịch sử chat

    // Hook để đóng tooltip khi click bên ngoài
    useClickOutside([wordTooltipRef, translateTooltipRef], () => {
        setWordTooltip(null);
        setTranslateTooltip(null);
    });

    // Thêm ref để tham chiếu đến container chứa danh sách tin nhắn, để cuộn xuống khi có tin nhắn mới
    const chatContainerRef = useRef(null);
    useEffect(() => {
        if (chatId && chatContainerRef.current) {
            // Trì hoãn cuộn để đảm bảo DOM được render xong
            setTimeout(() => {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }, 100);
        }
    }, [chatHistory, isSending]);

    // Xử lý config
    // if (configLoading || userLoading) {
    //     return <CircularProgress />;
    // }
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
                ref={chatContainerRef}
                sx={{
                    p: 2,
                    display: 'flex',
                    margin: '0 auto',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflowY: 'auto', // Cuộn nội dung bên trong ChatArea
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
                }}
            >
                {isSending || chatHistory.length > 0 ? (
                    chatHistory.map((msg, index) => (
                        <Box key={index} sx={{mt: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
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
                                        src={
                                            imageLoadStatus.aiChatIcon
                                                ? config.aiChatIcon
                                                : '/images/default-bot-avatar.jpg'
                                        }
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
                                                        bgcolor: 'white',
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
                                                <Tooltip title="Play Audio" placement="bottom">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            playMessage(msg.audioUrl, msg.ai, index, playSound, chatId)
                                                        }
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
                                                </Tooltip>

                                                <Tooltip title="Translate" placement="bottom">
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
                                                </Tooltip>
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
                                <img
                                    src={imageLoadStatus.logoImage ? config.logoImage : '/images/logo.png'}
                                    alt="Logo"
                                    style={{
                                        width: '100px',
                                        height: 'auto',
                                        marginRight: '8px',
                                        objectFit: 'contain',
                                    }}
                                />
                                <Typography variant="h4">Hi, I'm KT SpeakUp.</Typography>
                            </Box>
                            <Typography variant="h6">What are we talking about today?</Typography>
                        </Box>
                    </Box>
                )}
                {chatError && (
                    <Alert severity="error" sx={{mt: 2}}>
                        {chatError}
                    </Alert>
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
                                        fontSize: '.85rem',
                                        color: 'text.secondary',
                                    }}
                                >
                                    {wordTooltip.translatedWord}
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
                                        fontSize: '.85rem',
                                        color: 'text.secondary',
                                    }}
                                >
                                    {wordTooltip.translatedDefinition}
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
                                        disabled={isLoadingWord || isPlayingWord}
                                    >
                                        {isPlayingWord ? 'Fetching...' : 'Pronounce'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<BookmarkAddIcon fontSize="small" />}
                                        onClick={handleAddToVocab}
                                        disabled={isLoadingWord || wordTooltip.definition == 'No definition found'}
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
                                        {isLoadingWord ? 'Fetching...' : 'Add to Vocab'}
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
                            zIndex: 999,
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
