import React, {useState, useEffect} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';

import {useTheme} from '@mui/material/styles';
import {useMediaQuery} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import useSiteConfig from '../hooks/useSiteConfig';
import ConfirmDialog from './ConfirmDialog';
import useConfirmDialog from '../hooks/useConfirmDialog';
import useUserInfo from '../hooks/useUserInfo';
import {getAvatarInitial} from '../utils/avatarUtils';
import {useVocab} from '../hooks/useVocab';
import VocabDetails from './VocabDetails';
import VocabList from './VocabList';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [isOpen, setIsOpen] = useState(true); // Mở rộng trên desktop, thu nhỏ trên mobile
    const [anchorEl, setAnchorEl] = useState(null); //state cho menu user

    const navigate = useNavigate();
    const {userInfo, loading: userLoading, error: userError} = useUserInfo(userEmail); // Hook lấy thông tin user
    const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const {vocabList, selectedWord, setSelectedWord, isDeleteMode, setIsDeleteMode, deleteVocab} = useVocab(
        chatId,
        onVocabAdded
    ); // Hook xử lý từ vựng

    // Hàm mở và đóng Menu
    const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogoutClick = () => {
        showDialog({
            title: 'Confirm Logout',
            content: 'Are you sure want to logout?',
            onConfirm: () => {
                onLogout();
                hideDialog();
            },
            confirmText: 'Logout',
            confirmColor: 'primary',
        });
    };

    // Xóa từ vựng
    const handleDeleteVocab = (vocabId, word) => {
        showDialog({
            title: 'Delete Vocabulary',
            content: `Are you sure to delete "${word}"?`,
            onConfirm: () => {
                deleteVocab(vocabId, word);
                hideDialog();
            },
            confirmText: 'Delete',
            confirmColor: 'error',
        });
    };

    // màn hình tablet thì tự động đóng sidebar
    useEffect(() => {
        if (isTablet) {
            setIsOpen(false);
        }
    }, [isTablet]);

    // màn hình mobile thì tự động mở sidebar
    useEffect(() => {
        if (isMobile || !isTablet) {
            setIsOpen(true);
        }
    }, [isMobile, isTablet]);

    // Xử lý config, đặt trước return
    if (configError) {
        return <Alert severity="error">{configError}</Alert>;
    }

    // Xử lý userInfo
    if (userLoading) return <CircularProgress />;
    if (userError) return <Alert severity="error">{userError}</Alert>;

    return (
        <Box
            sx={{
                width: {
                    xs: '100%',
                    sm: isOpen ? 300 : 60,
                },
                p: isOpen ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                position: 'relative',
                transition: 'all .3s ease',
                borderLeft: {
                    xs: 'none',
                    sm: '1px solid',
                },
                borderColor: {
                    xs: 'transparent',
                    sm: 'divider',
                },
                height: '100%',
            }}
        >
            {/* Đóng mở sidebar */}
            {isOpen ? (
                <Box
                    sx={{
                        height: {
                            xs: 'calc(100vh - 64px)',
                            sm: '100%',
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {/* Phần 1: Thông tin user + Account Menu */}
                    {userEmail && userInfo && (
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            {/* Link: Admin thì hiện link quản lý, user thì hiện Welcome + displayName */}
                            {userInfo.isAdmin ? (
                                <Button
                                    component={RouterLink}
                                    to="/admin"
                                    startIcon={<AdminPanelSettingsIcon />}
                                    color="primary"
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        flexGrow: 1,
                                        pl: 5,
                                    }}
                                >
                                    Admin Panel
                                </Button>
                            ) : (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        overflow: 'hidden', //Giới hạn title
                                        textOverflow: 'ellipsis', //Thêm dấu ...
                                        whiteSpace: 'nowrap', //Không ngắt dòng
                                        '& > span': {
                                            fontWeight: 'bold',
                                            color: 'primary.main',
                                        },
                                        flexGrow: 1,
                                        textAlign: 'center',
                                        pl: 5,
                                    }}
                                >
                                    <span>{userInfo.displayName || userEmail}</span>
                                </Typography>
                            )}

                            {/* Account Menu */}
                            <Tooltip title="Profile" placement="bottom">
                                <IconButton onClick={handleMenuOpen} sx={{ml: 'auto'}}>
                                    <Avatar src={userInfo.avatarPath} sx={{bgcolor: 'primary.main'}}>
                                        {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                                        {!userInfo.avatarPath && getAvatarInitial(userInfo)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}

                    {/* Phần 2: Danh sách từ vựng (Chip) */}

                    <VocabList
                        vocabList={vocabList}
                        selectedWord={selectedWord}
                        onWordSelect={setSelectedWord}
                        onDeleteVocab={handleDeleteVocab}
                        config={config}
                        chatId={chatId}
                        isDeleteMode={isDeleteMode}
                        setIsDeleteMode={setIsDeleteMode}
                    />

                    {/* Phần 3: Chi tiết từ vựng */}
                    {vocabList.length > 0 && <VocabDetails word={selectedWord} onWordSelect={setSelectedWord} />}
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        gap: 2,
                        py: 12,
                        transition: 'all 0.3s ease',
                    }}
                >
                    <Tooltip title="Profile" placement="left">
                        <IconButton onClick={handleMenuOpen}>
                            <Avatar src={userInfo.avatarPath} sx={{bgcolor: 'primary.main'}}>
                                {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                                {!userInfo.avatarPath && getAvatarInitial(userInfo)}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Admin panel" placement="left">
                        <IconButton onClick={() => navigate('/admin')} sx={{mb: 2}}>
                            <AdminPanelSettingsIcon sx={{fontSize: '2rem', color: 'primary.main'}} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Nút toggle ẩn/hiện sidebar */}
            {!isMobile && (
                <Tooltip title={isOpen ? 'Close Right Sidebar' : 'Open Right Sidebar'} placement="left">
                    <IconButton
                        sx={{
                            position: 'absolute',
                            top: 35,
                            right: isOpen ? 259 : -1,
                            transition: 'right 0.3s ease',
                            zIndex: 1,
                            borderRadius: isOpen ? '0 50% 50% 0' : '50% 0 0 50%',
                            width: 40,
                            height: 40,
                            backgroundColor: 'primary.light',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <ChevronRightIcon
                            sx={{
                                fontSize: '32px',
                                color: 'primary.contrastText',
                                transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                                transition: 'transform 0.6s ease',
                            }}
                        />
                    </IconButton>
                </Tooltip>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 4,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        minWidth: 180,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleMenuClose}
                    sx={{
                        py: 1,
                        px: 2,
                        fontSize: '1rem',
                        color: 'grey.800',
                        '&:hover': {
                            bgcolor: 'primary.light', // Hiệu ứng hover
                            color: 'primary.contrastText', // Màu chữ khi hover
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <AccountCircleIcon />
                    Profile
                </MenuItem>
                <Divider sx={{my: 0.5}} />
                <MenuItem
                    onClick={handleLogoutClick}
                    sx={{
                        py: 1,
                        px: 2,
                        fontSize: '1rem',
                        color: 'grey.800',
                        '&:hover': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <LogoutIcon />
                    Logout
                </MenuItem>
            </Menu>
            {/* Hiển thị ConfirmDialog */}
            <ConfirmDialog
                open={dialog.open}
                title={dialog.title}
                content={dialog.content}
                onConfirm={dialog.onConfirm}
                onCancel={hideDialog}
                confirmText={dialog.confirmText}
                confirmColor={dialog.confirmColor}
            />
        </Box>
    );
}

export default RightSidebar;
