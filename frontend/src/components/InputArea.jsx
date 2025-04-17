// components/InputArea.jsx
import React, {useState, useRef} from 'react';
import {useSpeechToText} from '../hooks/useSpeechToText';
import {useMessageHandler} from '../hooks/useMessageHandler';
import {useSuggestions} from '../hooks/useSuggestions';
import {useWordTooltip} from '../hooks/useWordTooltip';
import {useClickOutside} from '../hooks/useClickOutside';
import {methodsConfig} from '../config/methodsConfig';
import {logger} from '../utils/logger';
import useAudioPlayer from '../hooks/useAudioPlayer';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {Tooltip as MuiTooltip} from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import SettingsIcon from '@mui/icons-material/Settings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

function InputArea({
    chatId,
    setChatId,
    onSendMessage,
    refreshChats,
    suggestionData,
    updateSuggestionData,
    onVocabAdded,
}) {
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('mistral');

    // State cho SpeedDial (Settings)
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuType, setMenuType] = useState(null);

    // State khi send
    const [isSending, setIsSending] = useState(false);

    // Sử dụng useAudioPlayer
    const {playSound, audioRef} = useAudioPlayer();

    // Hook để quản lý speech-to-text
    const {transcript, setTranscript, isRecording, startRecording, stopRecording} = useSpeechToText(sttMethod);

    // Hook để quản lý gửi tin nhắn
    const {handleSend} = useMessageHandler(
        chatId,
        setChatId,
        onSendMessage,
        refreshChats,
        generateMethod,
        ttsMethod,
        playSound
    );

    // Hook để quản lý gợi ý
    const {
        suggestionsOpen,
        setSuggestionsOpen,
        showTranslation,
        loading,
        isPlaying,
        fetchSuggestions,
        generateSuggestionsAudio,
        translateSuggestion,
    } = useSuggestions(chatId, updateSuggestionData, generateMethod, ttsMethod, playSound);

    // Hook để quản lý tra từ
    const {
        wordTooltip,
        setWordTooltip,
        wordTooltipRef,
        handleWordClick,
        handlePlay,
        handleAddToVocab,
        isPlaying: isPlayingWord,
    } = useWordTooltip({
        chatId,
        onVocabAdded,
    });

    // Hook để đóng tooltip khi click bên ngoài
    useClickOutside([wordTooltipRef], () => {
        setWordTooltip(null);
    });

    // Xử lý mở/đóng SpeedDial
    const handleSpeedDialOpen = () => setSpeedDialOpen(true);
    const handleSpeedDialClose = () => setSpeedDialOpen(false);

    // Xử lý mở menu con
    const handleMenuOpen = (event, type) => {
        setAnchorEl(event.currentTarget);
        setMenuType(type);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuType(null);
    };

    // Xử lý chọn method
    const handleMethodSelect = (method) => {
        if (menuType === 'stt') setSttMethod(method);
        if (menuType === 'generate') setGenerateMethod(method);
        if (menuType === 'tts') setTtsMethod(method);
        logger.info(`Selected ${menuType} method: ${method}`);
        handleMenuClose();
    };

    // Xử lý gửi tin nhắn
    const onSend = async () => {
        setIsSending(true);
        try {
            const result = await handleSend(transcript);
            if (result && result.aiResponse && result.currentChatId) {
                await fetchSuggestions(result.aiResponse, result.currentChatId);
            }
            setTranscript('');
        } finally {
            setIsSending(false);
        }
    };

    // Sử dụng React.memo hoặc memoize dữ liệu để tránh re-render không cần thiết
    const SuggestionContent = React.memo(
        ({
            suggestionData,
            showTranslation,
            handleWordClick,
            generateSuggestionsAudio,
            translateSuggestion,
            chatId,
            isPlaying,
        }) => (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                }}
            >
                <Box sx={{flexGrow: 1}}>
                    <Typography sx={{fontSize: '0.9rem'}}>
                        {suggestionData.latest_suggestion.split(' ').map((word, i) => (
                            <Box
                                component="span"
                                key={i}
                                onDoubleClick={(e) => handleWordClick(word, e)}
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'grey.300',
                                    },
                                }}
                            >
                                {word}{' '}
                            </Box>
                        ))}
                    </Typography>
                    {showTranslation && suggestionData.translate_suggestion && (
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: 'text.secondary',
                                mt: 0.5,
                            }}
                        >
                            Translation: {suggestionData.translate_suggestion}
                        </Typography>
                    )}
                </Box>

                {/* Icon */}
                <IconButton
                    onClick={() => generateSuggestionsAudio(suggestionData.latest_suggestion, chatId)}
                    disabled={isPlaying}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                    }}
                >
                    {isPlaying ? <CircularProgress size={20} /> : <VolumeUpIcon fontSize="small" />}
                </IconButton>
                <IconButton
                    onClick={() => translateSuggestion(suggestionData.latest_suggestion, chatId, suggestionData)}
                    sx={{
                        ml: 1,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                    }}
                >
                    {loading ? <CircularProgress size={20} /> : <TranslateIcon fontSize="small" />}
                </IconButton>
            </Box>
        )
    );

    return (
        <Box sx={{px: 2, pb: 2}}>
            <Box
                sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 8,
                    width: '100%',
                    p: 2,
                    pt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    bgcolor: 'background.paper',
                    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Khu vực 1: Icon Settings (SpeedDial) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -16,
                        left: 0,
                    }}
                >
                    {/* Backdrop hiển thị khi speedDialOpen là true */}
                    <Backdrop
                        open={speedDialOpen}
                        sx={{
                            zIndex: 1,
                            borderRadius: {md: 0, lg: 10},
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                        }}
                        onClick={handleSpeedDialClose}
                    />
                    <IconButton
                        onClick={() => setSpeedDialOpen((prev) => !prev)} //Toggle
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: speedDialOpen ? 'primary.light' : 'grey.200',
                            color: speedDialOpen ? 'primary.contrastText' : 'grey.primary',
                            '&:hover': {
                                bgcolor: speedDialOpen ? 'primary.dark' : 'grey.300',
                            },
                            zIndex: 1,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>

                    {/* Modal settings method */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 120,
                            display: speedDialOpen ? 'flex' : 'none',
                            gap: 12,
                            zIndex: 1,
                        }}
                    >
                        {Object.values(methodsConfig).map((action) => (
                            <Box key={action.name} sx={{position: 'relative'}}>
                                {/* Nút con */}
                                <IconButton
                                    onClick={(e) => handleMenuOpen(e, action.type)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                        '&:hover': {
                                            bgcolor: 'grey.100',
                                        },
                                    }}
                                >
                                    <action.icon />
                                </IconButton>

                                {/* Tooltip cho nút con */}
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        top: -40,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap',
                                        bgcolor: 'background.paper',
                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                        borderRadius: 1,
                                        p: 1,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {action.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Menu cho các phương thức */}
                    {menuType && methodsConfig[menuType] && (
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{mt: 1}}>
                            {methodsConfig[menuType].options.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    onClick={() => handleMethodSelect(option.value)}
                                    sx={{
                                        bgcolor:
                                            (menuType === 'stt' && sttMethod === option.value) ||
                                            (menuType === 'generate' && generateMethod === option.value) ||
                                            (menuType === 'tts' && ttsMethod === option.value)
                                                ? 'primary.light'
                                                : 'inherit',
                                    }}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Menu>
                    )}
                </Box>

                {/* Khu vực 2: Suggestions (Lightbulb Icon) */}
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 900,
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 1,
                            position: 'relative',
                        }}
                    >
                        <IconButton
                            onClick={() => setSuggestionsOpen(!suggestionsOpen)}
                            sx={{
                                position: 'absolute',
                                top: -32,
                                right: -8,
                                bgcolor: suggestionData.latest_suggestion ? 'primary.light' : 'grey.200',
                                color: suggestionData.latest_suggestion ? 'primary.contrastText' : 'grey.primary',
                                '&:hover': {
                                    bgcolor: suggestionData.latest_suggestion ? 'primary.main' : 'grey.300',
                                },
                                '&: disabled': {
                                    bgcolor: 'grey.200',
                                    color: 'grey.500',
                                },
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            }}
                        >
                            <LightbulbIcon />
                        </IconButton>
                    </Box>

                    <Collapse in={suggestionsOpen}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.100',
                                maxHeight: 180,
                                overflowY: 'auto',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    mb: 1,
                                    fontSize: '1rem',
                                }}
                            >
                                Suggestions:
                            </Typography>
                            {/* suggestionData lấy từ props */}
                            {suggestionData.latest_suggestion ? (
                                <SuggestionContent
                                    suggestionData={suggestionData}
                                    showTranslation={showTranslation}
                                    handleWordClick={handleWordClick}
                                    generateSuggestionsAudio={generateSuggestionsAudio}
                                    translateSuggestion={translateSuggestion}
                                    chatId={chatId}
                                    isPlaying={isPlaying}
                                />
                            ) : (
                                <Typography>No suggestions available</Typography>
                            )}
                        </Box>
                    </Collapse>
                </Box>

                {/* Khu vực 3: Input và Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '900px',
                        gap: 2,
                    }}
                >
                    {/* Icon Micro */}
                    <IconButton
                        onClick={isRecording ? stopRecording : startRecording}
                        sx={{
                            bgcolor: isRecording ? 'error.main' : 'primary.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: isRecording ? 'error.dark' : 'primary.dark',
                            },
                        }}
                    >
                        {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>

                    {/* Textarea */}
                    <TextareaAutosize
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Your speech here..."
                        minRows={1}
                        maxRows={3}
                        style={{
                            flexGrow: 1,
                            padding: '8px 12px',
                            borderRadius: 2,
                            border: 'none',
                            resize: 'none',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            '&:focus': {
                                borderColor: 'primary.main',
                                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                            },
                        }}
                    />

                    {/* Icon Send */}
                    <IconButton
                        onClick={onSend}
                        disabled={!transcript.trim() || isSending}
                        sx={{
                            bgcolor: transcript.trim() ? 'primary.main' : 'grey.300',
                            color: transcript.trim() ? 'white' : 'grey.500',
                            '&:hover': {
                                bgcolor: transcript.trim() ? 'primary.dark' : 'grey.400',
                            },
                        }}
                    >
                        {isSending ? <CircularProgress size={20} /> : <SendIcon />}
                    </IconButton>
                </Box>

                {/* Tooltip cho từ vựng */}
                {wordTooltip && (
                    <MuiTooltip
                        open
                        title={
                            <div ref={wordTooltipRef}>
                                <Box sx={{p: 1}}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{fontSize: '1.2rem', textTransform: 'capitalize'}}
                                    >
                                        <strong>{wordTooltip.word}</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{fontSize: '.95rem', mt: 1}}>
                                        {wordTooltip.definition}
                                    </Typography>
                                    <Typography variant="body2" sx={{fontSize: '.95rem', my: 1}}>
                                        {wordTooltip.phonetic}
                                    </Typography>
                                    <Box sx={{display: 'flex', gap: 1}}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VolumeUpIcon fontSize="small" />}
                                            onClick={() => handlePlay(wordTooltip.audio, wordTooltip.word)}
                                            disabled={isPlayingWord}
                                            sx={{
                                                textTransform: 'none',
                                                color: 'text.secondary',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    borderColor: 'text.secondary',
                                                },
                                            }}
                                        >
                                            {isPlayingWord ? 'Playing...' : 'Pronounce'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<BookmarkAddIcon fontSize="small" />}
                                            onClick={handleAddToVocab}
                                            disabled={wordTooltip.definition === 'No definition found'}
                                            sx={{
                                                textTransform: 'none',
                                                color: 'text.secondary',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    borderColor: 'text.secondary',
                                                },
                                                '&:disabled': {
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
                        placement="top"
                        componentsProps={{
                            tooltip: {
                                sx: {
                                    bgcolor: 'white',
                                    color: 'text.primary',
                                    p: 2,
                                    fontSize: '1.4rem',
                                    maxWidth: 400,
                                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
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

                {/* Audio element ẩn */}
                <audio ref={audioRef} style={{display: 'none'}} />
            </Box>
        </Box>
    );
}

export default InputArea;
