//components/SettingsSpeedDial.jsx
import React, {useState, useEffect} from 'react';
import {methodsConfig} from '../config/methodsConfig';
import {updateMethods, getCurrentUser} from '../services/authService';
import {useEnabledMethods} from '../hooks/useEnabledMethods';
import {toast} from 'react-toastify';
import {logger} from '../utils/logger';
import {useDictionary} from '../context/DictionaryContext';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Backdrop from '@mui/material/Backdrop';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {Tooltip as MuiTooltip} from '@mui/material';
import Typography from '@mui/material/Typography';
import SettingsIcon from '@mui/icons-material/Settings';

function SettingsSpeedDial({sttMethod, setSttMethod, ttsMethod, setTtsMethod, generateMethod, setGenerateMethod}) {
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuType, setMenuType] = useState(null);
    const [error, setError] = useState(null);

    //lấy danh sách method được bật
    const {enabledMethods, error: fetchError, loading: fetchLoading} = useEnabledMethods();

    // Lấy và đặt dictionary source từ Context
    const {dictionarySource, setDictionarySource} = useDictionary();

    // Cập nhật error nếu có lỗi khi gọi API
    useEffect(() => {
        if (fetchError) {
            setError(fetchError);
        }
    }, [fetchError]);

    //lấy sẵn các method được bật từ config
    let sttOptions, generateOptions, ttsOptions, firstEnabledStt, firstEnabledGenerate, firstEnabledTts;
    useEffect(() => {
        if (enabledMethods.length > 0) {
            sttOptions = methodsConfig.stt.options.map((opt) => opt.value);
            generateOptions = methodsConfig.generate.options.map((opt) => opt.value);
            ttsOptions = methodsConfig.tts.options.map((opt) => opt.value);

            firstEnabledStt = sttOptions.find((opt) => enabledMethods.includes(opt));
            firstEnabledGenerate = generateOptions.find((opt) => enabledMethods.includes(opt));
            firstEnabledTts = ttsOptions.find((opt) => enabledMethods.includes(opt));
        }
    });

    // Đặt method cho người dùng
    useEffect(() => {
        const initializeMethods = async () => {
            try {
                // Load methods đã lưu từ database
                const userData = await getCurrentUser();
                logger.info('User data:', userData);
                const userMethods = userData.methods || {};

                // Ưu tiên web-speech làm mặc định nếu không có method STT nào được chọn
                setSttMethod(userMethods.stt || 'web-speech');
                setGenerateMethod(userMethods.generate || firstEnabledGenerate || 'gemini');
                setTtsMethod(userMethods.tts || firstEnabledTts || 'gtts');
                setDictionarySource(userMethods.dictionary || 'dictionaryapi');

                // Ưu tiên methods từ database, nếu không có thì dùng mặc định
            } catch (err) {
                logger.error('Error initializing methods:', err.message);
                setSttMethod(firstEnabledStt || 'web-speech');
                setGenerateMethod(firstEnabledGenerate || 'gemini');
                setTtsMethod(firstEnabledTts || 'gtts');
                setDictionarySource('dictionaryapi');
            }
        };
        // Chỉ chạy khi enabledMethods đã load xong
        if (!fetchLoading) {
            initializeMethods();
        }
    }, [fetchLoading, enabledMethods]);

    // Xử lý mở/đóng SpeedDial
    const handleSpeedDialOpen = () => setSpeedDialOpen(true);
    const handleSpeedDialClose = () => setSpeedDialOpen(false);

    // Xử lý mở menu con
    const handleMenuOpen = (event, type) => {
        setAnchorEl(event.currentTarget);
        setMenuType(type);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuType(null);
    };

    // Xử lý chọn method
    const handleMethodSelect = (method) => {
        // Kiểm tra xem method có trong mảng enabledMethods không, ngoại trừ loại dictionary
        if (menuType !== 'dictionary' && method !== 'web-speech' && !enabledMethods.includes(method)) {
            toast.error(`Method "${method}" is disabled or unsupported.`);
            return;
        }
        // Nếu method được bật => cập nhật state
        if (menuType === 'stt') setSttMethod(method);
        if (menuType === 'generate') setGenerateMethod(method);
        if (menuType === 'tts') setTtsMethod(method);
        if (menuType === 'dictionary') setDictionarySource(method);
        logger.info(`Selected ${menuType} method: ${method}`);
        toast.info(`Selected ${menuType} method: ${method}`);

        // (1) Gọi API để lưu method vào database
        saveMethodToDatabase(menuType, method);

        handleMenuClose();
    };

    // Hàm lưu method vào database
    const saveMethodToDatabase = async (type, method) => {
        try {
            const methods = {[type]: method};
            await updateMethods(methods);

            logger.info(`Saved ${type} method: ${method}`);
        } catch (err) {
            logger.error(`Error saving ${type} method: ${err.message}`);
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                top: -16,
                left: 0,
            }}
        >
            {/* Hiển thị lỗi nếu có */}
            {error && (
                <Alert severity="error" sx={{mb: 2, width: '100%'}}>
                    {error}
                </Alert>
            )}
            {/* Backdrop hiển thị khi speedDialOpen là true */}
            <Backdrop
                open={speedDialOpen}
                sx={{
                    zIndex: 2,
                    borderRadius: {md: 0, lg: 10},
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                }}
                onClick={handleSpeedDialClose}
            />
            {/* icon Setting */}
            <MuiTooltip title="Select Method" placement="top">
                <IconButton
                    onClick={() => setSpeedDialOpen((prev) => !prev)} //Toggle
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: speedDialOpen ? 'primary.light' : 'grey.200',
                        color: speedDialOpen ? 'primary.contrastText' : 'grey.primary',
                        '&:hover': {
                            bgcolor: speedDialOpen ? 'primary.dark' : 'grey.300',
                        },
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    <SettingsIcon />
                </IconButton>
            </MuiTooltip>

            {/* Modal settings method */}
            <Box
                sx={{
                    position: 'absolute',
                    top: {xs: -320, md: -150},
                    left: {xs: 40, md: 0},
                    display: speedDialOpen ? 'flex' : 'none',
                    gap: {xs: 20, md: 15},
                    zIndex: 2,
                    flexWrap: {xs: 'wrap', md: 'nowrap'}, // (2) Sử dụng wrap-reverse trên mobile để xếp từ dưới lên
                    width: {xs: '300px', md: 'auto'},
                }}
            >
                {Object.values(methodsConfig).map((action) => (
                    <Box key={action.name} sx={{position: 'relative'}}>
                        {/* Nút con */}
                        <IconButton
                            onClick={(e) => handleMenuOpen(e, action.type)}
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                '&:hover': {
                                    bgcolor: 'grey.100',
                                },
                            }}
                        >
                            <action.icon />
                        </IconButton>

                        {/* Tooltip cho nút con */}
                        <Typography
                            sx={{
                                position: 'absolute',
                                top: -40,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                whiteSpace: 'nowrap',
                                bgcolor: 'background.paper',
                                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                borderRadius: 1,
                                p: 1,
                                fontSize: '0.75rem',
                            }}
                        >
                            {action.name}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Menu cho các phương thức */}
            {menuType && methodsConfig[menuType] && (
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} sx={{mt: 1, p: 0.5}}>
                    {methodsConfig[menuType].options
                        .filter((option) => {
                            // Luôn cho phép web-speech trong stt
                            if(menuType === 'stt' && option.value === 'web-speech') return true;
                            if (menuType === 'dictionary') return true;
                            return enabledMethods.includes(option.value);
                        }) // Lọc các phương thức được bật // Ngoại lệ cho dictionary: luôn hiển thị tất cả tùy chọn
                        .map((option) => (
                            <MenuItem
                                key={option.value}
                                onClick={() => handleMethodSelect(option.value)}
                                sx={{
                                    bgcolor:
                                        (menuType === 'stt' && sttMethod === option.value) ||
                                        (menuType === 'generate' && generateMethod === option.value) ||
                                        (menuType === 'tts' && ttsMethod === option.value) ||
                                        (menuType === 'dictionary' && dictionarySource === option.value)
                                            ? 'primary.light'
                                            : 'inherit',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {option.label}
                            </MenuItem>
                        ))}
                </Menu>
            )}
        </Box>
    );
}
export default SettingsSpeedDial;
