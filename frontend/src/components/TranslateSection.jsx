import React, {useState} from 'react';
import Box from '@mui/material/Box';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton'
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { logger } from '../utils/logger';

const TranslateSection = ({open, onTranslate, sourceLang, targetLang, playSound, ttsMethod}) => {
    const [sourceText, setSourceText] = useState('');
    const [targetText, setTargetText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [ttsError, setTtsError] = useState('');

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setIsTranslating(true);
        try {
            const translatedText = await onTranslate(sourceText);
            setTargetText(translatedText || 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };
    const handlePlayAudio = async () => {
        if (!targetText.trim()) return;
        setIsPlaying(true);
        setTtsError('');
        try {
            await playSound({
                text: targetText,
                ttsMethod: ttsMethod,
            });
        } catch(error){
            setTtsError('The selected audio method is not compatible with the characters you entered.');
            await playSound({
                text: targetText,
                ttsMethod: 'gtts',
            });
            logger.error('TTS error:', error);
        }finally {
            setIsPlaying(false);
        }
    }

    return (
        <Box
            sx={{
                width: '100%',
                mt: 2,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 4,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Box sx={{mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <TextareaAutosize
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={`Nhập nội dung ${sourceLang}...`}
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
                    sx={{textTransform: 'none', ml: 2, minWidth: '100px'}}
                >
                    {isTranslating ? <CircularProgress size={20} /> : 'Translate'}
                </Button>
            </Box>
            {targetText && (
                <Box sx={{mt: 2, display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="body1" sx={{mt: 2, fontSize: '1rem', fontStyle: 'italic', color: 'text.primary'}}>
                        {targetText}
                    </Typography>

                    <IconButton
                        onClick={handlePlayAudio}
                        disabled={isPlaying || !sourceText.trim()}
                        sx={{ml: 1, bgcolor: 'primary.main', color: 'white',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            }
                        }}
                    >
                        {isPlaying ? <CircularProgress size={20} /> : <VolumeUpIcon fontSize="small" />}
                    </IconButton>
                </Box>
            )}
            {ttsError && (
                <Typography variant="body2" sx={{mt: 1, color: 'error.main'}}>
                    {ttsError}
                </Typography>
            )}
        </Box>
    );
};

export default TranslateSection;
