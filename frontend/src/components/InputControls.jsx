import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import {Tooltip as MuiTooltip} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';


const InputControls = ({
    transcript,
    setTranscript,
    isRecording,
    startRecording,
    stopRecording,
    isSending,
    isProcessing,
    isPlayingWord,
    onSend,
    translateOpen,
    setTranslateOpen,
    sourceLang,
    targetLang,
    handleTranscriptChange,
    handleTextareaFocus,
    handleTextareaBlur,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '900px',
                gap: 2,
            }}
        >
            {/* Icon Micro || CircularProgress khi sending */}
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
                {isProcessing ? (
                    <CircularProgress
                        size={24}
                        sx={{
                            color: 'white',
                        }}
                    />
                ) : isRecording ? (
                    <StopIcon />
                ) : (
                    <MicIcon />
                )}
            </IconButton>

            {/* Textarea */}
            <TextareaAutosize
                value={transcript}
                onChange={handleTranscriptChange}
                onFocus={handleTextareaFocus} // Hủy timeout khi nhấn vào
                onBlur={handleTextareaBlur}
                placeholder="Your speech here..."
                minRows={1}
                maxRows={2}
                style={{
                    flexGrow: 1,
                    padding: '8px 12px',
                    borderRadius: 2,
                    border: 'none',
                    resize: 'none',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    backgroundColor: 'transparent',
                }}
            />

            {/* Icon Send */}
            <IconButton
                onClick={onSend}
                disabled={
                    isRecording ||
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
    );
};

export default InputControls;
