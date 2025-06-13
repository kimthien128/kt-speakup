import useSiteConfig from './hooks/useSiteConfig';
import {useImageLoadStatus} from './utils/imageLoader';

import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import {Box, Container} from '@mui/material';

function MainLayout({children}) {
    const {config, loading, error} = useSiteConfig();

    // Cấu hình các hình ảnh cần kiểm tra
    const imageConfigs = [{key: 'backgroundImage', url: config?.backgroundImage}];
    // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
    const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

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
                p: {md: 0, lg: 4},
                height: '100vh',
                background: imageLoadStatus.backgroundImage
                    ? `url("${config.backgroundImage}")`
                    : 'url("/images/default-bg.jpg")',
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
                    background: 'rgba(0, 0, 0, 0.02)', // Overlay để làm nổi bật text
                    zIndex: 1,
                    // backdropFilter: 'blur(5px)',
                },
            }}
        >
            {/* Box bao bọc có radius */}
            <Container
                disableGutters // Tắt padding mặc định
                sx={{
                    display: 'flex',
                    borderRadius: {md: 0, lg: 10},
                    border: {md: 'none', lg: '2px solid'},
                    borderColor: {md: 'none', lg: 'rgba(255, 255, 255, .5)'},
                    boxShadow: '0 0 80px rgba(0, 0, 0, 0.15)',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(60px)',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    zIndex: 2,
                    height: '100%',
                }}
            >
                {children}
            </Container>
        </Box>
    );
}

export default MainLayout;
