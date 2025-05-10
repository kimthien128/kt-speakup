import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import {Tooltip as MuiTooltip} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';

const SuggestionContent = ({
    suggestionData,
    showTranslation,
    handleWordClick,
    generateSuggestionsAudio,
    translateSuggestion,
    chatId,
    isPlaying,
    loading,
}) => {
    // console.log('[SuggestionContent] suggestionData:', suggestionData);

    return (
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

            {/* Icon phát âm thanh và translate */}
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
    );
};

export default SuggestionContent;
