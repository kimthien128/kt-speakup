import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import {ThemeProvider} from '@mui/material/styles';
import theme from './theme';

import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    p: 4,
                    height: '100vh',
                    background: 'linear-gradient(135deg, #ef88bb 0%, #291850 100%)',
                    backgroundImage: 'url("https://marketplace.canva.com/EAGD_ug6bbY/1/0/1600w/canva-PXPfiI0IpT4.jpg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.1)', // Overlay để làm nổi bật text
                        zIndex: 1,
                        backdropFilter: 'blur(5px)',
                    },
                }}
            >
                {/* Box bao bọc có radius */}
                <Container
                    disableGutters // Tắt padding mặc định
                    sx={{
                        display: 'flex',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(20px)',
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        width: '100%',
                        zIndex: 2,
                    }}
                >
                    <App />
                </Container>
            </Box>
        </ThemeProvider>
    </StrictMode>
);
