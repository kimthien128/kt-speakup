//components/SiteConfig.jsx
import React, {useState, useEffect} from 'react';
import {updateConfig} from '../services/configService';
import {Typography, Alert, CircularProgress, IconButton, Button, Box} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ConfirmDialog from './ConfirmDialog';

function SiteConfig({config: initialConfig, setConfig}) {
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [aiIconFile, setAiIconFile] = useState(null);
    const [aiIconPreview, setAiIconPreview] = useState('');
    const [heroFile, setHeroFile] = useState(null);
    const [heroPreview, setHeroPreview] = useState('');
    const [saveWordFile, setSaveWordFile] = useState(null);
    const [saveWordPreview, setSaveWordPreview] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => {},
    });

    // Cập nhật preview ban đầu từ config
    useEffect(() => {
        if (initialConfig) {
            setBackgroundPreview(initialConfig.backgroundImage || '');
            setLogoPreview(initialConfig.logoImage || '');
            setAiIconPreview(initialConfig.aiChatIcon || '');
            setHeroPreview(initialConfig.heroImage || '');
            setSaveWordPreview(initialConfig.saveWordImage || '');
        }
    }, [initialConfig]);

    // Xử lý upload file
    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only PNG, JPG, and GIF accepted');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            setError('File size should be less than 2MB');
            return;
        }

        setError('');
        setFile(file);
        setPreview(URL.createObjectURL(file));
    };

    // Xử lý lưu thay đổi
    const handleSaveChanges = async () => {
        setConfirmDialog({
            open: true,
            title: 'Confirm Save changes',
            content: 'Are you sure you want to save changes?',
            onConfirm: async () => {
                setLoading(true);
                setError('');
                setSuccess('');

                try {
                    const formData = new FormData();
                    if (backgroundFile) formData.append('background', backgroundFile);
                    if (logoFile) formData.append('logo', logoFile);
                    if (aiIconFile) formData.append('aiIcon', aiIconFile);
                    if (heroFile) formData.append('hero', heroFile);
                    if (saveWordFile) formData.append('saveWord', saveWordFile);

                    const updatedConfig = await updateConfig(formData);
                    setConfig(updatedConfig);

                    // Cập nhật previews với dữ liệu mới
                    setBackgroundPreview(updatedConfig.backgroundImage || '');
                    setLogoPreview(updatedConfig.logoImage || '');
                    setAiIconPreview(updatedConfig.aiChatIcon || '');
                    setHeroPreview(updatedConfig.heroImage || '');
                    setSaveWordPreview(updatedConfig.saveWordImage || '');

                    // Reset file states
                    setBackgroundFile(null);
                    setLogoFile(null);
                    setAiIconFile(null);
                    setHeroFile(null);
                    setSaveWordFile(null);

                    setSuccess('Config updated successfully');
                } catch (err) {
                    setError(err.response?.data?.detail || 'Failed to update config');
                    console.error('Error updating config:', err.response?.data || err.message);
                } finally {
                    setLoading(false);
                    setConfirmDialog((prev) => ({...prev, open: false}));
                }
            },
        });
    };

    return (
        <>
            <Typography
                variant="h6"
                sx={{
                    textAlign: 'center',
                }}
            >
                Site Config
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    width: '100%',
                }}
            >
                <Box
                    sx={{
                        overflowY: 'auto',
                        flexGrow: 1,
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
                    }}
                >
                    <Grid container>
                        {/* Background Image */}
                        <Grid size={{xs: 6, md: 4, lg: 3}} sx={{textAlign: 'center', mt: 2}}>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                Background Image
                            </Typography>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={backgroundPreview || null}
                                    sx={{
                                        width: {xs: 130, md: 170},
                                        height: {xs: 130, md: 170},
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleFileChange(e, setBackgroundFile, setBackgroundPreview)}
                                    />
                                </IconButton>
                            </Box>
                        </Grid>

                        {/* Logo Image */}
                        <Grid size={{xs: 6, md: 4, lg: 3}} sx={{textAlign: 'center', mt: 2}}>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                Logo Image
                            </Typography>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={logoPreview || null}
                                    sx={{
                                        width: {xs: 130, md: 170},
                                        height: {xs: 130, md: 170},
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                                    />
                                </IconButton>
                            </Box>
                        </Grid>

                        {/* AI Chat Icon */}
                        <Grid size={{xs: 6, md: 4, lg: 3}} sx={{textAlign: 'center', mt: 2}}>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                AI Chat Icon
                            </Typography>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={aiIconPreview || null}
                                    sx={{
                                        width: {xs: 130, md: 170},
                                        height: {xs: 130, md: 170},
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleFileChange(e, setAiIconFile, setAiIconPreview)}
                                    />
                                </IconButton>
                            </Box>
                        </Grid>

                        {/* Hero Image */}
                        <Grid size={{xs: 6, md: 4, lg: 3}} sx={{textAlign: 'center', mt: 2}}>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                Hero Image
                            </Typography>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={heroPreview || null}
                                    sx={{
                                        width: {xs: 130, md: 170},
                                        height: {xs: 130, md: 170},
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleFileChange(e, setHeroFile, setHeroPreview)}
                                    />
                                </IconButton>
                            </Box>
                        </Grid>

                        {/* Save word Image */}
                        <Grid size={{xs: 6, md: 4, lg: 3}} sx={{textAlign: 'center', mt: 2}}>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                Save Word Image
                            </Typography>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                }}
                            >
                                <Box
                                    component="img"
                                    src={saveWordPreview || null}
                                    sx={{
                                        width: {xs: 130, md: 170},
                                        height: {xs: 130, md: 170},
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                        border: '2px solid white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <CameraAltIcon fontSize="small" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => handleFileChange(e, setSaveWordFile, setSaveWordPreview)}
                                    />
                                </IconButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Box
                    sx={{
                        mt: 4,
                        flexShrink: 0, // Đảm bảo phần này không bị co lại
                    }}
                >
                    {/* Thông báo và nút Save */}
                    {error && (
                        <Alert severity="error" sx={{my: 3}}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{my: 3}}>
                            {success}
                        </Alert>
                    )}

                    <Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveChanges}
                            disabled={loading}
                            fullWidth
                            sx={{
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                borderRadius: 2,
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Dialog xác nhận */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                content={confirmDialog.content}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({...prev, open: false}))}
                confirmText="Confirm"
                cancelText="Cancel"
            />
        </>
    );
}
export default SiteConfig;
