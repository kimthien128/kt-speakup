import React from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {Tooltip as MuiTooltip} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

import SuggestionContent from './SuggestionContent';

const SuggestionSection = ({
    suggestionsOpen,
    setSuggestionsOpen,
    suggestionData,
    showTranslation,
    handleWordClick,
    generateSuggestionsAudio,
    translateSuggestion,
    chatId,
    isPlaying,
    translating,
    isSending,
}) => {
    // console.log('SuggestionSection received suggestionData:', suggestionData);

    return (
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
                                    translating={translating}
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
    );
};

export default SuggestionSection;
