import React, {useState, useRef} from 'react';
import axios from '../axiosInstance';
import useAudioPlayer from '../hooks/useAudioPlayer';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import Backdrop from '@mui/material/Backdrop';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import SettingsIcon from '@mui/icons-material/Settings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import SpeechToTextIcon from '@mui/icons-material/RecordVoiceOver';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import TextToSpeechIcon from '@mui/icons-material/VoiceOverOff';
import {Icon} from '@mui/material';

function InputArea({chatId, setChatId, onSendMessage, refreshChats}) {
    const [transcript, setTranscript] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [sttMethod, setSttMethod] = useState('vosk');
    const [ttsMethod, setTtsMethod] = useState('gtts');
    const [generateMethod, setGenerateMethod] = useState('mistral');
    const mediaRecorderRef = useRef(null);
    const {playSound, audioRef} = useAudioPlayer();

    // State cho SpeedDial (Settings)
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuType, setMenuType] = useState(null);

    // State cho khu vực Suggestions
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);

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
        // handleSpeedDialClose(); // Đóng SpeedDial sau khi chọn xong
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
            `Short follow-up to: "${baseText}"`,
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
                if (!res.data.error) newSuggestions.push(res.data.response);
            } catch (err) {
                console.error('Suggestion error:', err);
            }
        }
        setSuggestions(newSuggestions.slice(0, 1)); // Lấy 2 gợi ý thì đổi thành 2
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

    const handleWordClick = (word, event) => {
        console.log(`Clicked word: ${word}`); // Xử lý thêm nếu cần
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
                            // disabled={suggestions.length <= 0}
                            sx={{
                                position: 'absolute',
                                top: -32,
                                right: -8,
                                bgcolor: suggestions.length > 0 ? 'primary.light' : 'grey.200',
                                color: suggestions.length > 0 ? 'primary.contrastText' : 'grey.primary',
                                '&:hover': {
                                    bgcolor: suggestions.length > 0 ? 'primary.main' : 'grey.300',
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
                                maxHeight: 150,
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
                            {suggestions.length > 0 ? (
                                suggestions.map((suggestion, index) => (
                                    <Typography key={index} sx={{mb: 0.5, fontSize: '0.9rem'}}>
                                        {suggestion && typeof suggestion === 'string' ? (
                                            suggestion.split(' ').map((word, i) => (
                                                <span
                                                    key={i}
                                                    onDoubleClick={(e) => handleWordClick(word, e)}
                                                    style={{
                                                        padding: '2px 4px',
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            bgcolor: 'primary.light',
                                                        },
                                                    }}
                                                >
                                                    {word}{' '}
                                                </span>
                                            ))
                                        ) : (
                                            <span>No suggestion available</span>
                                        )}
                                    </Typography>
                                ))
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

                {/* Audio element ẩn */}
                <audio ref={audioRef} style={{display: 'none'}} />
            </Box>
        </Box>
    );
}

export default InputArea;
