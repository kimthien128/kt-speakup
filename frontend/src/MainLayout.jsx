import useSiteConfig from './hooks/useSiteConfig';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import {Box, Container} from '@mui/material';

function MainLayout({children}) {
    const {config, loading, error} = useSiteConfig();

    // Xử lý config
    if (loading) {
        return <CircularProgress />;
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                p: 4,
                height: '100vh',
                background: config?.backgroundImage
                    ? `url("${config.backgroundImage}")`
                    : 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
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
                {children}
            </Container>
        </Box>
    );
}

export default MainLayout;
