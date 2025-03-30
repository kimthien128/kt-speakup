import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import theme from './theme';

import App from './App.jsx';
import MainLayout from './MainLayout';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <MainLayout>
                <App />
            </MainLayout>
        </ThemeProvider>
    </StrictMode>
);
