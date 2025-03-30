import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Box, Typography, Paper, Alert, CircularProgress, IconButton, Button} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import axios from '../axiosInstance';
import ConfirmDialog from './ConfirmDialog';

function AdminPanel() {
    const [config, setConfig] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [aiIconFile, setAiIconFile] = useState(null);
    const [aiIconPreview, setAiIconPreview] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => {},
    });
    const navigate = useNavigate();

    // Fetch config khi component mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get('/config');
                setConfig(res.data);
                setBackgroundPreview(res.data.backgroundImage || '');
                setLogoPreview(res.data.logoImage || '');
                setAiIconPreview(res.data.aiChatIcon || '');
            } catch (err) {
                setError('Failed to load config');
                console.error('Error fetching config:', err.response?.data || err.message);
                if (err.response?.status === 403) {
                    navigate('/profile');
                }
            }
        };
        fetchConfig();
    }, [navigate]);

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

                    const res = await axios.patch('/config', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    setConfig(res.data);
                    setBackgroundPreview(res.data.backgroundImage || '');
                    setLogoPreview(res.data.logoImage || '');
                    setAiIconPreview(res.data.aiChatIcon || '');
                    setBackgroundFile(null);
                    setLogoFile(null);
                    setAiIconFile(null);
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
        <Box
            sx={{
                p: {xs: 2, md: 4},
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            <Box
                sx={{
                    width: '90%',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textAlign: 'center',
                        my: 4,
                        position: 'relative',
                    }}
                >
                    {/* Back Button */}
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/')}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '1rem',
                            borderRadius: 1,
                            position: 'absolute',
                        }}
                    >
                        Back to Chat
                    </Button>

                    <Typography
                        variant="h4"
                        sx={{
                            flexGrow: 1,
                        }}
                    >
                        Admin Panel
                    </Typography>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        p: {xs: 2, md: 4},
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        bgcolor: 'white',
                    }}
                >
                    <Box sx={{display: 'flex', justifyContent: 'space-around'}}>
                        {/* Background Image */}
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h6" sx={{mb: 2}}>
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
                                        width: 200,
                                        height: 200,
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
                        </Box>

                        {/* Logo Image */}
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h6" sx={{mb: 2}}>
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
                                        width: 200,
                                        height: 200,
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
                        </Box>

                        {/* AI Chat Icon */}
                        <Box sx={{textAlign: 'center'}}>
                            <Typography variant="h6" sx={{mb: 2}}>
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
                                        width: 200,
                                        height: 200,
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
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            mt: 4,
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
                                    py: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    borderRadius: 2,
                                }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                content={confirmDialog.content}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({...prev, open: false}))}
                confirmText="Confirm"
                cancelText="Cancel"
            />
        </Box>
    );
}

export default AdminPanel;
