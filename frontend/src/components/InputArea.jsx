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
import Collapse from '@mui/material/Collapse';
import {Tooltip as MuiTooltip} from '@mui/material';
import Alert from '@mui/material/Alert';

import SettingsSpeedDial from './SettingsSpeedDial';
import InputControls from './InputControls';
import SuggestionSection from './SuggestionSection';
import TranslateSection from './TranslateSection';
import AutoSendProgress from './AutoSendProgress';
import WordTooltip from './WordTooltip';

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

    // biến ngôn ngữ
    const [sourceLang, setSourceLang] = useState('Vietnamese');
    const [targetLang, setTargetLang] = useState('English');

    // Sử dụng useAudioPlayer
    const {playSound, audioRef} = useAudioPlayer();

    // Hook để quản lý speech-to-text
    const {transcript, setTranscript, isRecording, isProcessing, startRecording, stopRecording} =
        useSpeechToText(sttMethod);

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
            setTimeLeft(8); // Bắt đầu đếm ngược từ 10s khi transcript được cập nhật
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
    const handleTranslate = async (text) => {
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
                text,
                sourceLang: sourceLang,
                targetLang: targetLang,
            });
            return translatedText; // Trả về kết quả để TranslateSection cập nhật targetText
        } catch (err) {
            logger.error('Translation error:', err);
            return 'Error translating text';
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
                <SuggestionSection
                    suggestionsOpen={suggestionsOpen}
                    setSuggestionsOpen={setSuggestionsOpen}
                    suggestionData={suggestionData}
                    showTranslation={showTranslation}
                    handleWordClick={handleWordClick}
                    generateSuggestionsAudio={generateSuggestionsAudio}
                    translateSuggestion={translateSuggestion}
                    chatId={chatId}
                    isPlaying={isPlaying}
                    loading={loading}
                    isSending={isSending}
                />

                {/* Khu vực 3: Input và Actions */}
                <InputControls
                    transcript={transcript}
                    setTranscript={setTranscript}
                    isRecording={isRecording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    isSending={isSending}
                    isProcessing={isProcessing}
                    isPlayingWord={isPlayingWord}
                    onSend={onSend}
                    translateOpen={translateOpen}
                    setTranslateOpen={setTranslateOpen}
                    sourceLang={sourceLang}
                    targetLang={targetLang}
                    handleTranscriptChange={handleTranscriptChange}
                    handleTextareaFocus={handleTextareaFocus}
                    handleTextareaBlur={handleTextareaBlur}
                />

                {/* Khu vực 4: Chuyển ngữ */}
                <Collapse in={translateOpen} sx={{width: '100%', maxWidth: '900px'}}>
                    <TranslateSection
                        open={translateOpen}
                        onTranslate={handleTranslate}
                        sourceLang={sourceLang}
                        targetLang={targetLang}
                    />
                </Collapse>

                {/* Hiển thị tiến trình tự động gửi (nếu có) */}
                {timeLeft > 0 && <AutoSendProgress timeLeft={timeLeft} />}

                {/* Tooltip cho từ vựng */}
                {wordTooltip && (
                    <MuiTooltip
                        open
                        title={
                            <WordTooltip
                                wordTooltip={wordTooltip}
                                wordTooltipRef={wordTooltipRef}
                                handlePlay={handlePlay}
                                handleAddToVocab={handleAddToVocab}
                                isPlayingWord={isPlayingWord}
                                showTranslated={true}
                            />
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
