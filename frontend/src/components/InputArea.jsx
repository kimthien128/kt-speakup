// components/InputArea.jsx
import React, {useState, useRef, useEffect} from 'react';
import {logger} from '../utils/logger';
import {useSpeechToText} from '../hooks/useSpeechToText';
import {useMessageHandler} from '../hooks/useMessageHandler';
import {useSuggestions} from '../hooks/useSuggestions';
import {useWordTooltip} from '../hooks/useWordTooltip';
import {useClickOutside} from '../hooks/useClickOutside';
import useAudioPlayer from '../hooks/useAudioPlayer';
import {useDictionary} from '../context/DictionaryContext';
import {createChat} from '../services/chatsService';
import {translate} from '../services/generateService';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import {Tooltip as MuiTooltip} from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

import SettingsSpeedDial from './SettingsSpeedDial';

function InputArea({
    chatId,
    setChatId,
    onSendMessage,
    refreshChats,
    suggestionData,
    updateSuggestionData,
    onVocabAdded,
}) {
    const [sttMethod, setSttMethod] = useState('assemblyai');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('gemini');
    const [error, setError] = useState(null);
    const {dictionarySource} = useDictionary(); // Lấy dictionary source từ context

    // State khi send
    const [isSending, setIsSending] = useState(false);

    //state cho tự động gửi
    const [isFocused, setIsFocused] = useState(false);
    const [autoSendTimeout, setAutoSendTimeout] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [prevTranscript, setPrevTranscript] = useState(''); // Lưu transcript trước đó để phát hiện thay đổi

    // State cho chức năng chuyển ngữ
    const [translateOpen, setTranslateOpen] = useState(false);
    const [sourceText, setSourceText] = useState('');
    const [targetText, setTargetText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    // biến ngôn ngữ
    const [sourceLang, setSourceLang] = useState('Vietnamese');
    const [targetLang, setTargetLang] = useState('English');

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
        dictionarySource, // Truyền dictionarySource vào
    });

    // Hook để đóng tooltip khi click bên ngoài
    useClickOutside([wordTooltipRef], () => {
        setWordTooltip(null);
    });

    // Xử lý gửi tin nhắn
    const onSend = async () => {
        setIsSending(true);
        setTranscript(''); // Xóa textarea ngay khi nhấn Send
        setError(null); // Reset lỗi trước khi gửi
        try {
            const result = await handleSend(transcript);
            if (result && result.aiResponse && result.currentChatId) {
                await fetchSuggestions(result.aiResponse, result.currentChatId);
            }
        } catch (err) {
            if (err.response?.status === 400) {
                setError(err.response.data.detail); // Hiển thị lỗi từ backend (ví dụ: "Client mistral is disabled or unsupported")
            } else {
                setError('Failed to send message. Please try again.');
            }
        } finally {
            setIsSending(false);
            setTimeLeft(0); // Reset tiến trình khi gửi thủ công
            if (autoSendTimeout) {
                clearTimeout(autoSendTimeout); // Xóa timeout nếu có
                setAutoSendTimeout(null);
            }
        }
    };

    // Kiểm tra transcript thay đổi để kích hoạt đếm ngược
    useEffect(() => {
        if (
            !isFocused && // Chỉ chạy khi không focus
            !isRecording &&
            transcript !== prevTranscript && // Chỉ chạy khi transcript thay đổi
            transcript.trim() &&
            transcript.toLowerCase() !== 'no speech detected' &&
            transcript.toLowerCase() !== 'failed to process audio'
        ) {
            setTimeLeft(10); // Bắt đầu đếm ngược từ 10s khi transcript được cập nhật
            const timeoutId = setTimeout(() => {
                onSend(); // Gửi tin nhắn sau 10 giây
            }, 10000);
            setAutoSendTimeout(timeoutId); // Lưu timeout ID để có thể xóa sau này

            // Cập nhật thời gian còn lại mỗi giây
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer); // Dừng đếm ngược khi thời gian còn lại <= 0
                        return 0;
                    }
                    return prev - 1; // Giảm thời gian còn lại mỗi giây
                });
            }, 1000);
        }
        setPrevTranscript(transcript); // Cập nhật transcript trước đó
    }, [transcript, isFocused, isRecording, prevTranscript]);

    // Hủy tự động gửi khi nhấn vào Textarea hoặc thay đổi transcript
    const handleTextareaFocus = () => {
        setIsFocused(true);
        if (autoSendTimeout) {
            clearTimeout(autoSendTimeout); // Xóa timeout nếu có
            setAutoSendTimeout(null);
            setTimeLeft(0); // Reset tiến trình
        }
    };

    const handleTextareaBlur = () => {
        setIsFocused(false);
    };

    const handleTranscriptChange = (e) => {
        setTranscript(e.target.value);
        if (autoSendTimeout) {
            clearTimeout(autoSendTimeout);
            setAutoSendTimeout(null);
            setTimeLeft(0); // Reset tiến trình
        }
    };

    // Xử lý chuyển ngữ
    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);

        let currentChatId = chatId;
        try {
            // Nếu chatId không hợp lệ, tạo chat mới trước
            if (
                !currentChatId ||
                currentChatId === 'null' ||
                currentChatId === 'undefined' ||
                typeof currentChatId !== 'string'
            ) {
                currentChatId = await createChat(); // Tạo chat mới
                setChatId(currentChatId); // Cập nhật chatId trong state
                if (refreshChats) await refreshChats(); // Cập nhật danh sách chat nếu có
            }

            const translatedText = await translate({
                method: generateMethod,
                text: sourceText,
                sourceLang: sourceLang,
                targetLang: targetLang,
            });
            setTargetText(translatedText || 'Translation failed');
        } catch (err) {
            logger.error('Translation error:', err);
            setTargetText('Error translating text');
        } finally {
            setIsTranslating(false);
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
                            {suggestionData.translate_suggestion}
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

                <MuiTooltip title="Translate" placement="top">
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
                </MuiTooltip>
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
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <Alert severity="error" sx={{mb: 2, width: '100%'}}>
                        {error}
                    </Alert>
                )}
                {/* Khu vực 1: Icon Settings (SpeedDial) */}
                <SettingsSpeedDial
                    sttMethod={sttMethod}
                    setSttMethod={setSttMethod}
                    ttsMethod={ttsMethod}
                    setTtsMethod={setTtsMethod}
                    generateMethod={generateMethod}
                    setGenerateMethod={setGenerateMethod}
                />

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
                        <MuiTooltip title={!suggestionsOpen ? 'Show Suggestion' : 'Hide Suggestion'} placement="top">
                            <IconButton
                                // disabled={!suggestionData.latest_suggestion}
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
                        </MuiTooltip>
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
                            {isSending ? (
                                <CircularProgress size={18} />
                            ) : (
                                <>
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
                                </>
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
                        disabled={isSending || isPlayingWord} // Disable khi đang gửi hoặc phát âm
                    >
                        {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>

                    {/* Textarea */}
                    <TextareaAutosize
                        value={transcript}
                        onChange={handleTranscriptChange}
                        onFocus={handleTextareaFocus} // Hủy timeout khi nhấn vào
                        onBlur={handleTextareaBlur}
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

                    {/* Icon Chuyển ngữ */}
                    <MuiTooltip title={`Translate from ${sourceLang} to ${targetLang}`} placement="top">
                        <IconButton
                            onClick={() => setTranslateOpen(!translateOpen)}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            }}
                        >
                            <SwapHorizIcon />
                        </IconButton>
                    </MuiTooltip>

                    {/* Icon Send */}

                    <IconButton
                        onClick={onSend}
                        disabled={
                            !transcript.trim() ||
                            isSending ||
                            transcript.toLowerCase() === 'no speech detected' ||
                            transcript.toLowerCase() === 'failed to process audio'
                        }
                        sx={{
                            bgcolor: transcript.trim() ? 'primary.main' : 'grey.300',
                            color: transcript.trim() ? 'white' : 'grey.500',
                            '&:hover': {
                                bgcolor: transcript.trim() ? 'primary.dark' : 'grey.400',
                            },
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>

                {/* Khu vực 4: Chuyển ngữ */}
                <Collapse in={translateOpen} sx={{width: '100%', maxWidth: '900px'}}>
                    <Box
                        sx={{
                            width: '100%',
                            mt: 2,
                            p: 2,
                            bgcolor: 'grey.100',
                            borderRadius: 2,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <Box sx={{mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <TextareaAutosize
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder={`Enter text in ${sourceLang}...`}
                                minRows={1}
                                maxRows={3}
                                style={{
                                    width: '100%',
                                    flexGrow: 1,
                                    padding: '8px 12px',
                                    borderRadius: 4,
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

                            <Button
                                variant="contained"
                                onClick={handleTranslate}
                                disabled={isTranslating || !sourceText.trim()}
                                sx={{textTransform: 'none', ml: 2}}
                            >
                                {isTranslating ? <CircularProgress size={20} /> : 'Translate'}
                            </Button>
                        </Box>
                        {targetText && (
                            <Typography
                                variant="body1"
                                sx={{mt: 2, fontSize: '1rem', fontStyle: 'italic', color: 'text.primary'}}
                            >
                                {targetText}
                            </Typography>
                        )}
                    </Box>
                </Collapse>

                {/* Hiển thị tiến trình tự động gửi (nếu có) */}
                {timeLeft > 0 && (
                    <Box sx={{width: '100%', maxWidth: '900px', mt: 1}}>
                        <LinearProgress
                            variant="determinate"
                            value={100 - (timeLeft / 10) * 100} // Tính toán phần trăm còn lại
                            sx={{
                                height: '4px',
                                borderRadius: 2,
                                bgcolor: 'grey.300',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: 'primary.main',
                                },
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{color: 'text.secondary', textAlign: 'right', display: 'block', mt: 0.5}}
                        >
                            Auto sending in {timeLeft}s... (Editing will cancel auto-send)
                        </Typography>
                    </Box>
                )}

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
