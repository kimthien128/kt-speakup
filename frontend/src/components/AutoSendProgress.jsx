import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

const AutoSendProgress = ({timeLeft}) => {
    return (
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
            <Typography variant="caption" sx={{color: 'text.secondary', textAlign: 'right', display: 'block', mt: 0.5}}>
                Auto sending in {timeLeft}s... (Editing will cancel auto-send)
            </Typography>
        </Box>
    );
};

export default AutoSendProgress;
