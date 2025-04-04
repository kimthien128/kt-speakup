// components/InputArea.jsx
import React, {useState, useRef} from 'react';
import axios from '../axiosInstance';
import useAudioPlayer from '../hooks/useAudioPlayer';
import useWordInfo from '../hooks/useWordInfo';
import {toast} from 'react-toastify';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import {Tooltip as MuiTooltip} from '@mui/material';
import Button from '@mui/material/Button';

import SettingsIcon from '@mui/icons-material/Settings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import SpeechToTextIcon from '@mui/icons-material/RecordVoiceOver';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import TextToSpeechIcon from '@mui/icons-material/VoiceOverOff';
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
    const [transcript, setTranscript] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('mistral');
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef(null);
    const {playSound, audioRef} = useAudioPlayer();
    const {tooltip, tooltipRef, handleWordClick, handlePlay, handleAddToVocab} = useWordInfo({
        chatId,
        onVocabAdded,
        dictionarySource: 'dictionaryapi',
    });

    // State cho SpeedDial (Settings)
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuType, setMenuType] = useState(null);

    // State cho khu vực Suggestions
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);

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
        console.log(`Selected ${menuType} method: ${method}`);
        handleMenuClose();
    };

    // Actions cho SpeedDial
    const actions = [
        {icon: <SpeechToTextIcon />, name: 'Speech-to-Text', type: 'stt'},
        {icon: <ModelTrainingIcon />, name: 'Generate Model', type: 'generate'},
        {icon: <TextToSpeechIcon />, name: 'Text-to-Speech', type: 'tts'},
    ];

    // Ghi âm
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.start();
            setIsRecording(true);

            mediaRecorderRef.current.ondataavailable = async (e) => {
                const audioBlob = e.data; // Lấy trực tiếp từ event
                // Gửi audioBlob tới /stt
                try {
                    const sttResponse = await axios.post(`/stt?method=${sttMethod}`, audioBlob, {
                        headers: {
                            'Content-Type': 'audio/webm',
                        },
                    });
                    setTranscript(sttResponse.data.transcript || '');
                } catch (err) {
                    console.log('Fetch error:', err.response?.data || err.message);
                    setTranscript('Failed to process audio');
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
            };
        } catch (err) {
            console.log('Error:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    // Lấy gợi ý từ AI
    const fetchSuggestions = async (baseText, currentChatId) => {
        const suggestionPrompts = [
            `Please answer or ask the following follow-up questions to stimulate conversation for this sentence:: "${baseText}"`,
            // `Short next question after: "${baseText}"` // Tạm thời chỉ lấy 1 gợi ý
        ];
        const newSuggestions = [];
        for (const prompt of suggestionPrompts) {
            try {
                const res = await axios.post(
                    `/generate?method=${generateMethod}`,
                    {transcript: prompt, chat_id: currentChatId},
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                if (!res.data.error) {
                    newSuggestions.push(res.data.response);

                    // Lưu suggestion mới nhất vào database
                    if (newSuggestions.length > 0) {
                        const latestSuggestion = newSuggestions[0];
                        await axios.put(
                            `/chats/${currentChatId}/suggestion`,
                            {
                                latest_suggestion: latestSuggestion,
                                translate_suggestion: '',
                                suggestion_audio_url: '',
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                    }
                }
            } catch (err) {
                console.error('Suggestion error:', err);
            }
        }
        setSuggestions(newSuggestions.slice(0, 1)); // Lấy 2 gợi ý thì đổi thành 2
    };

    // Hàm tạo âm thanh cho suggestion và cập nhật suggestion_audio_url
    const generateSuggestionsAudio = async (suggestion, currentChatId) => {
        if (isPlaying) return; // Ngăn chặn phát nhiều audio cùng lúc
        setIsPlaying(true);

        try {
            // Kiểm tra có audio trên database chưa
            const chatResponse = await axios.get(`/chats/${currentChatId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const chatData = chatResponse.data;
            let audioUrl = chatData.suggestion_audio_url;

            //Nếu đã có suggestion_audio_url, phát âm thanh trực tiếp
            if (audioUrl) {
                console.log('Using existing suggestion audio URL:', audioUrl);
                await playSound({audioUrl});
                return;
            }

            //Nếu không có suggestion_audio_url, tạo mới bằng playSound
            console.log('Generating new suggestion audio...');
            const result = await playSound({
                word: suggestion,
                ttsMethod,
                chatId: currentChatId,
                updateSuggestionAudioUrl: true,
            });
            if (result && result.audioUrl) {
                console.log('Generated and updated suggestion audio URL:', result.audioUrl);
            }
        } catch (err) {
            console.error('Error generating suggestion audio:', err);
        } finally {
            setIsPlaying(false);
        }
    };

    // Hàm dịch suggestion và cập nhật translation trong database
    const translateSuggestion = async (suggestion, currentChatId) => {
        try {
            // Nếu translation đã tồn tại và giống với giá trị hiện tại, không gọi API
            if (suggestionData.translate_suggestion && showTranslation) {
                setShowTranslation(false);
                return;
            }

            // Gọi endpoint /translate để dịch suggestion
            const translateResponse = await axios.post(
                `/translate`,
                {text: suggestion, target_lang: 'vi'},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const translatedText = translateResponse.data.translatedText;

            // Chir Cập nhật translation vào database neeus có thay đổi
            if (suggestionData.translate_suggestion !== translatedText) {
                await axios.put(
                    `/chats/${currentChatId}/suggestion`,
                    {
                        translate_suggestion: translatedText,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
                // Cập nhật suggestionData qua callback từ ChatPage
                updateSuggestionData({translate_suggestion: translatedText});
            }
            setShowTranslation(true); // Hiển thị translation
            return translatedText;
        } catch (err) {
            console.error('Error translating suggestion:', err);
            throw err;
        }
    };

    // Gửi tin nhắn và xử lý phản hồi
    const handleSend = async () => {
        if (!transcript.trim()) return; // Ngăn gửi nếu transcript rỗng
        console.log('Sending transcript:', transcript);

        let currentChatId = chatId;
        // Nếu chatId không hợp lệ, tạo chat mới trước
        if (
            !currentChatId ||
            currentChatId === 'null' ||
            currentChatId === 'undefined' ||
            typeof currentChatId !== 'string'
        ) {
            try {
                const res = await axios.post(`/chats`);
                currentChatId = res.data.chat_id;
                setChatId(currentChatId); // Cập nhật chatId và URL
                if (refreshChats) await refreshChats(); // Cập nhật danh sách sau khi tạo chat
            } catch (err) {
                console.error('Error creating chat:', err.response?.data || err.message);
                setTranscript('Error creating chat');
                return;
            }
        }

        // Hiển thị tin nhắn người dùng ngay lập tức
        const userMessage = {user: transcript, ai: '...'};
        if (onSendMessage) {
            onSendMessage(userMessage); // Gửi tin nhắn tạm ngay lập tức
        }
        const temp = transcript;
        setTranscript(''); // Xóa textarea

        try {
            // Xử lý viết hoa chữ cái đầu
            const userInput = temp.charAt(0).toUpperCase() + temp.slice(1);

            // Gửi transcript đến /generate để lấy phản hồi từ AI
            const generateResponse = await axios.post(
                `/generate?method=${generateMethod}`,
                {transcript: userInput, chat_id: currentChatId},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (generateResponse.data.error) throw new Error(generateResponse.data.error);
            const aiResponse = generateResponse.data.response;

            // Lấy audioUrl từ /tts và truyền vào playSound
            const ttsResponse = await axios.post(
                `/tts?method=${ttsMethod}`,
                {text: aiResponse},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            const audioUrl = ttsResponse.headers['x-audio-url'];
            await playSound({audioUrl}); // Phát âm thanh với audioUrl

            // Lưu vào backend /chats/{chat_id}/history
            await axios.post(
                `/chats/${currentChatId}/history`,
                {user: userInput, ai: aiResponse, audioUrl: audioUrl},
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Cập nhật ChatArea với phản hồi AI
            const updatedMessage = {user: userInput, ai: aiResponse};
            if (onSendMessage) onSendMessage(updatedMessage);

            // Cập nhật danh sách sau khi gửi tin nhắn
            if (refreshChats) await refreshChats();

            // Lấy gợi ý dựa trên response
            await fetchSuggestions(aiResponse, currentChatId);
        } catch (err) {
            console.log('Error in handleSend:', err.response?.data || err.message);
            const errorMessage = {user: userInput, ai: 'Error processing response'};
            if (onSendMessage) {
                onSendMessage(errorMessage);
            }
        }
    };

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
                            borderRadius: 10,
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
                        {actions.map((action, index) => (
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
                                    {action.icon}
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

                    {/* Menu cho STT */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && menuType === 'stt'}
                        onClose={handleMenuClose}
                        sx={{mt: 1}}
                    >
                        <MenuItem
                            onClick={() => handleMethodSelect('assemblyai')}
                            sx={{bgcolor: sttMethod === 'assemblyai' ? 'primary.light' : 'inherit'}}
                        >
                            AssemblyAI (API)
                        </MenuItem>
                        <MenuItem
                            onClick={() => handleMethodSelect('vosk')}
                            sx={{bgcolor: sttMethod === 'vosk' ? 'primary.light' : 'inherit'}}
                        >
                            Vosk (Local)
                        </MenuItem>
                    </Menu>

                    {/* Menu cho Generate Model */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && menuType === 'generate'}
                        onClose={handleMenuClose}
                        sx={{mt: 1}}
                    >
                        <MenuItem
                            onClick={() => handleMethodSelect('mistral')}
                            sx={{bgcolor: generateMethod === 'mistral' ? 'primary.light' : 'inherit'}}
                        >
                            Mistral
                        </MenuItem>
                        <MenuItem
                            onClick={() => handleMethodSelect('gemini')}
                            sx={{bgcolor: generateMethod === 'gemini' ? 'primary.light' : 'inherit'}}
                        >
                            Gemini
                        </MenuItem>
                    </Menu>

                    {/* Menu cho TTS */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl) && menuType === 'tts'}
                        onClose={handleMenuClose}
                        sx={{mt: 1}}
                    >
                        <MenuItem
                            onClick={() => handleMethodSelect('gtts')}
                            sx={{bgcolor: ttsMethod === 'gtts' ? 'primary.light' : 'inherit'}}
                        >
                            gTTS (Google)
                        </MenuItem>
                        <MenuItem
                            onClick={() => handleMethodSelect('piper')}
                            sx={{bgcolor: ttsMethod === 'piper' ? 'primary.light' : 'inherit'}}
                        >
                            Piper (Local)
                        </MenuItem>
                    </Menu>
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
                                maxHeight: 200,
                                overflowY: 'auto',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
                                        onClick={() =>
                                            generateSuggestionsAudio(suggestionData.latest_suggestion, chatId)
                                        }
                                        sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                        }}
                                    >
                                        <VolumeUpIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => translateSuggestion(suggestionData.latest_suggestion, chatId)}
                                        sx={{
                                            ml: 1,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                        }}
                                    >
                                        <TranslateIcon fontSize="small" />
                                    </IconButton>
                                </Box>
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
                        onClick={handleSend}
                        disabled={!transcript.trim()}
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

                {/* Tooltip cho từ vựng */}
                {tooltip && (
                    <MuiTooltip
                        open
                        title={
                            <div ref={tooltipRef}>
                                <Box sx={{p: 1}}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{fontSize: '1.2rem', textTransform: 'capitalize'}}
                                    >
                                        <strong>{tooltip.word}</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{fontSize: '.95rem', mt: 1}}>
                                        {tooltip.definition}
                                    </Typography>
                                    <Typography variant="body2" sx={{fontSize: '.95rem', my: 1}}>
                                        {tooltip.phonetic}
                                    </Typography>
                                    <Box sx={{display: 'flex', gap: 1}}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VolumeUpIcon fontSize="small" />}
                                            onClick={() => handlePlay(tooltip.audio, tooltip.word)}
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
                                            Pronounce
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<BookmarkAddIcon fontSize="small" />}
                                            onClick={handleAddToVocab}
                                            disabled={tooltip.definition === 'N/A'}
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

                {/* Audio element ẩn */}
                <audio ref={audioRef} style={{display: 'none'}} />
            </Box>
        </Box>
    );
}

export default InputArea;
