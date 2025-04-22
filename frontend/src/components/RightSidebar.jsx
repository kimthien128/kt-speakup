import React, {useState, useEffect} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';

import {useTheme} from '@mui/material/styles';
import {useMediaQuery} from '@mui/material';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import CircleIcon from '@mui/icons-material/Circle';

import useSiteConfig from '../hooks/useSiteConfig';
import ConfirmDialog from './ConfirmDialog';
import useConfirmDialog from '../hooks/useConfirmDialog';
import useUserInfo from '../hooks/useUserInfo';
import {getAvatarInitial} from '../utils/avatarUtils';
import {useVocab} from '../hooks/useVocab';

function RightSidebar({userEmail, onLogout, chatId, onVocabAdded}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Kiểm tra nếu là thiết bị di động
    const [isOpen, setIsOpen] = useState(!isMobile); // Mở rộng trên desktop, thu nhỏ trên mobile
    const [anchorEl, setAnchorEl] = useState(null); //state cho menu user

    const navigate = useNavigate();
    const {userInfo, loading: userLoading, error: userError} = useUserInfo(userEmail); // Hook lấy thông tin user
    const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog
    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const {
        vocabList,
        searchTerm,
        setSearchTerm,
        selectedWord,
        wordDetails,
        loadingDetails,
        isDeleteMode,
        setIsDeleteMode,
        error: vocabError,
        fetchWordDetails,
        deleteVocab,
        filteredVocab,
    } = useVocab(chatId, onVocabAdded); // Hook xử lý từ vựng

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

    // tự động cập nhật isOpen khi kích thước màn hình thay đổi
    useEffect(() => {
        setIsOpen(!isMobile);
    }, [isMobile]);

    // Xử lý config, đặt trước return
    if (configLoading) {
        return <CircularProgress />;
    }
    if (configError) {
        return <Alert severity="error">{configError}</Alert>;
    }

    // Xử lý userInfo
    if (userLoading) return <CircularProgress />;
    if (userError) return <Alert severity="error">{userError}</Alert>;

    return (
        <Box
            sx={{
                width: isOpen ? 300 : 60,
                height: '100%',
                p: isOpen ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                position: 'relative',
                transition: 'all .3s ease',
                borderLeft: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Đóng mở sidebar */}
            {isOpen ? (
                <Box sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {/* Phần 1: Thông tin user + Account Menu */}
                    {userEmail && userInfo && (
                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, mb: 2}}>
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
                                    }}
                                >
                                    Welcome <span>{userInfo.displayName || userEmail}</span>
                                </Typography>
                            )}

                            {/* Account Menu */}
                            <Tooltip title="Profile" placement="bottom">
                                <IconButton onClick={handleMenuOpen}>
                                    <Avatar src={userInfo.avatarPath} sx={{bgcolor: 'primary.main'}}>
                                        {/* Hiển thị chữ cái đầu nếu không có avatarPath */}
                                        {!userInfo.avatarPath && getAvatarInitial(userInfo)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}

                    {/* Phần 2: Danh sách từ vựng (Chip) */}

                    <Box
                        sx={{
                            maxHeight: wordDetails ? '37%' : '100%',
                            overflowY: 'auto',
                            textAlign: 'center',
                            flexShrink: 0,
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
                        }}
                    >
                        {vocabList.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1,
                                }}
                            >
                                <Tooltip title="Search Vocabulary" placement="bottom">
                                    <FormControl sx={{flexGrow: 1, mr: 1}} variant="outlined">
                                        <OutlinedInput
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search vocabulary"
                                            size="small"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            }
                                        />
                                    </FormControl>
                                </Tooltip>
                                <Tooltip title={isDeleteMode ? 'Exit delete mode' : 'Delete vocabulary'}>
                                    <IconButton onClick={() => setIsDeleteMode(!isDeleteMode)} sx={{ml: 1}}>
                                        {isDeleteMode ? <CancelIcon color="error" /> : <DeleteIcon />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                        {filteredVocab.length > 0 ? (
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                                {filteredVocab.map((vocab) => (
                                    <Chip
                                        key={vocab._id}
                                        label={vocab.word}
                                        onClick={() => fetchWordDetails(vocab.word)}
                                        onDelete={
                                            isDeleteMode ? () => handleDeleteVocab(vocab._id, vocab.word) : undefined
                                        }
                                        sx={{
                                            bgcolor: selectedWord === vocab.word ? 'primary.dark' : 'primary.light',
                                            color: 'white',
                                            '&:hover': {bgcolor: 'primary.main'},
                                        }}
                                    />
                                ))}
                            </Box>
                        ) : chatId && chatId !== 'null' && chatId !== 'undefined' ? (
                            vocabList.length === 0 && (
                                <>
                                    <img
                                        src={config?.saveWordImage || null}
                                        alt="KT SpeakUp Logo"
                                        style={{width: '70px', objectFit: 'cover', objectPosition: 'center'}}
                                    />
                                    <Typography variant="body1">Save your first word !!</Typography>
                                </>
                            )
                        ) : (
                            <></>
                        )}
                    </Box>

                    {/* Phần 3: Chi tiết từ vựng */}
                    {vocabList.length > 0 && (
                        <Box
                            sx={{
                                flexGrow: 1,
                                minHeight: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                mt: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    flexGrow: 1,
                                    minHeight: 0,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1)', // Màu thứ 2 là màu khi hover
                                }}
                            >
                                {loadingDetails ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%',
                                        }}
                                    >
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    wordDetails && (
                                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                            {/* Definition */}
                                            <Box>
                                                <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                    Definition
                                                </Typography>
                                                <Typography variant="body2" sx={{ml: 2}}>
                                                    {wordDetails.definition || 'Not available'}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{my: 1}} />

                                            {/* Phonetic */}
                                            <Box>
                                                <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                    Phonetic
                                                </Typography>
                                                <Typography variant="body2" sx={{ml: 2}}>
                                                    {wordDetails.phonetic || 'Not available'}
                                                </Typography>
                                            </Box>
                                            <Divider sx={{my: 1}} />

                                            {/* Audio */}
                                            {wordDetails.audio && wordDetails.audio.length > 0 && (
                                                <>
                                                    <Box>
                                                        <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                            Audio
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                ml: 2,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 1,
                                                            }}
                                                        >
                                                            {wordDetails.audio.map((audioUrl, index) => (
                                                                <Box key={index} sx={{width: '100%', maxWidth: 300}}>
                                                                    <audio
                                                                        controls
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '40px',
                                                                        }}
                                                                    >
                                                                        <source src={audioUrl} type="audio/mpeg" />
                                                                        Your browser does not support the audio element.
                                                                    </audio>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                    <Divider sx={{my: 1}} />
                                                </>
                                            )}

                                            {/* Examples */}
                                            {wordDetails.examples && wordDetails.examples.length > 0 && (
                                                <>
                                                    <Box>
                                                        <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                            Examples
                                                        </Typography>
                                                        <List dense sx={{ml: 2, py: 0}}>
                                                            {wordDetails.examples.map((example, index) => (
                                                                <ListItem
                                                                    key={index}
                                                                    sx={{
                                                                        alignItems: 'flex-start',
                                                                        '&:not(:first-of-type)': {
                                                                            pt: '8px !important',
                                                                        },
                                                                    }}
                                                                >
                                                                    <ListItemIcon sx={{minWidth: 24, pt: 0.5}}>
                                                                        <CircleIcon sx={{fontSize: 8}} />
                                                                    </ListItemIcon>
                                                                    <ListItemText
                                                                        primary={example}
                                                                        primaryTypographyProps={{variant: 'body2'}}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </Box>
                                                    <Divider sx={{my: 1}} />
                                                </>
                                            )}

                                            {/* Pronunciations */}
                                            {wordDetails.pronunciations && wordDetails.pronunciations.length > 0 && (
                                                <>
                                                    <Box>
                                                        <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                            Pronunciations
                                                        </Typography>
                                                        <List dense sx={{ml: 2, py: 0}}>
                                                            {wordDetails.pronunciations.map((pron, index) => (
                                                                <ListItem key={index} sx={{py: 0.5}}>
                                                                    <ListItemIcon sx={{minWidth: 24}}>
                                                                        <CircleIcon sx={{fontSize: 8}} />
                                                                    </ListItemIcon>
                                                                    <ListItemText
                                                                        primary={pron}
                                                                        primaryTypographyProps={{variant: 'body2'}}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    </Box>
                                                    <Divider sx={{my: 1}} />
                                                </>
                                            )}

                                            {/* Top Example */}
                                            {wordDetails.topExample && (
                                                <Box>
                                                    <Typography variant="h6" sx={{fontWeight: 'medium', mb: 1}}>
                                                        Top Example
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ml: 2}}>
                                                        {wordDetails.topExample}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        gap: 2,
                        py: 8,
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
            <Tooltip title={isOpen ? 'Close Right Sidebar' : 'Open Right Sidebar'} placement="left">
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 20,
                        right: isOpen ? 260 : 5,
                        transition: 'right 0.3s ease',
                        zIndex: 1000,
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <MenuOpenIcon /> : <MenuIcon sx={{fontSize: '32px', color: 'primary.main'}} />}
                </IconButton>
            </Tooltip>

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
