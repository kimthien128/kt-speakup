import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

const WordTooltip = ({
    wordTooltip,
    wordTooltipRef,
    handlePlay,
    handleAddToVocab,
    isPlayingWord,
    isLoadingWord = false, // Mặc định là false, có thể bỏ qua nếu không dùng
    showTranslated = true, // Tùy chọn để hiển thị translatedWord và translatedDefinition
}) => {
    return (
        <div
            ref={wordTooltipRef} // Gắn ref cho vùng tooltip
        >
            <Box sx={{p: 1}}>
                <Typography variant="subtitle1" sx={{fontSize: '1.2rem', textTransform: 'capitalize'}}>
                    <strong>{wordTooltip.word}</strong>
                </Typography>
                {showTranslated && wordTooltip.translatedWord && (
                    <Typography variant="body2" sx={{fontSize: '.85rem', color: 'text.secondary'}}>
                        {wordTooltip.translatedWord}
                    </Typography>
                )}

                <Typography
                    variant="body2"
                    sx={{
                        fontSize: '.95rem',
                        mt: 1,
                    }}
                >
                    {wordTooltip.definition}
                </Typography>
                {showTranslated && wordTooltip.translatedDefinition && (
                    <Typography variant="body2" sx={{fontSize: '.85rem', color: 'text.secondary'}}>
                        {wordTooltip.translatedDefinition}
                    </Typography>
                )}

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
    );
};

export default WordTooltip;
