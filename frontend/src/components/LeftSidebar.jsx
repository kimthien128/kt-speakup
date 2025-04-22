import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import useSiteConfig from '../hooks/useSiteConfig';
import {useChatList} from '../hooks/useChatList';
import useConfirmDialog from '../hooks/useConfirmDialog';
import ConfirmDialog from './ConfirmDialog';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify

import {useTheme} from '@mui/material/styles';
import {useMediaQuery} from '@mui/material';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home'; // sau này thay logo

function LeftSidebar({onSelectChat, refreshChatsCallback, selectedChatId}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Kiểm tra nếu là thiết bị di động
    const [isOpen, setIsOpen] = useState(!isMobile); // Mở rộng trên desktop, thu nhỏ trên mobile

    const {config, loading: configLoading, error: configError} = useSiteConfig();
    const navigate = useNavigate();
    const editRef = useRef(null); // Ref để kiểm tra click ngoài
    const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog

    // Sử dụng hook useChatList
    const {
        chats,
        filteredChats,
        loading: chatLoading,
        error: chatError,
        searchChatTitle,
        setSearchChatTitle,
        editingChatId,
        setEditingChatId,
        editTitle,
        setEditTitle,
        createChat,
        deleteChat,
        startEditChat,
        saveChatTitle,
    } = useChatList(onSelectChat, refreshChatsCallback);

    // tự động cập nhật isOpen khi kích thước màn hình thay đổi
    useEffect(() => {
        setIsOpen(!isMobile);
    }, [isMobile]);

    // Hủy chỉnh sửa khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (editRef.current && !editRef.current.contains(e.target)) {
                setEditingChatId(null);
            }
        };
        if (editingChatId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingChatId]);

    // Xóa chat
    const handleDeleteChat = async (chatId) => {
        showDialog({
            title: 'Confirm Delete Chat',
            content: 'Are you sure you want to delete chat?',
            onConfirm: () => {
                deleteChat(chatId);
                hideDialog();
            },
            confirmText: 'Delete',
            confirmColor: 'error',
        });
    };

    // Lưu title mới
    const handleSaveTitle = async (chatId) => {
        if (!editTitle.trim()) {
            toast.error('Title cannot be empty');
            return;
        }

        showDialog({
            title: 'Confirm update chat title',
            content: 'Are you sure you want to delete chat?',
            onConfirm: () => {
                saveChatTitle(chatId);
                hideDialog();
            },
            confirmText: 'Update',
            confirmColor: 'primary',
        });
    };

    return (
        <Box
            sx={{
                height: '100%',
                width: isOpen ? 300 : 60,
                p: isOpen ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0, // Sửa: Ngăn co giãn
                borderTopLeftRadius: 40,
                borderBottomLeftRadius: 40,
                position: 'relative',
                transition: 'all .3s ease',
                borderRight: '1px solid',
                borderColor: 'divider',
            }}
        >
            {/* Đóng mở sidebar */}
            {isOpen ? (
                <div>
                    {/* Logo */}

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 2,
                        }}
                    >
                        <Box
                            onClick={() => navigate('/')}
                            sx={{
                                height: '100px',
                                cursor: 'pointer',
                            }}
                        >
                            <Tooltip title="Home" placement="bottom">
                                <img
                                    src={config?.logoImage || null}
                                    alt="KT SpeakUp Logo"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                    }}
                                />
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Control Chat */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        {/* Search title chat */}
                        <Tooltip title="Search chat" placement="bottom">
                            <FormControl sx={{flexGrow: 1, mr: 1}} variant="outlined">
                                <OutlinedInput
                                    type="text"
                                    value={searchChatTitle}
                                    onChange={(e) => setSearchChatTitle(e.target.value)}
                                    placeholder="Search chat"
                                    size="small"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                        </Tooltip>

                        {/* Create new chat */}
                        <Tooltip title="Create new chat">
                            <IconButton
                                color="primary"
                                onClick={() => navigate('/')} //có thể dùng createChat để tạo chat mới
                                sx={{
                                    p: 1, // Sửa: Tăng padding để vùng click lớn hơn
                                    fontSize: '1.8rem', // Sửa: Tăng kích thước tổng thể của IconButton
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText',
                                    },
                                }}
                            >
                                <AddIcon
                                    sx={{
                                        fontSize: '1.8rem', // Sửa: Tăng kích thước icon
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Danh sách chat */}
                    <Box sx={{overflowY: 'auto', flexGrow: 1}}>
                        <List sx={{width: '100%'}}>
                            {filteredChats.map((chat) => (
                                <ListItem
                                    key={chat._id}
                                    onClick={() => onSelectChat(chat._id)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        bgcolor: chat._id === selectedChatId ? 'rgba(0, 0, 0, .15)' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, .15)',
                                            transition: 'background-color 0.2s',
                                        },
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                        minHeight: 55,
                                    }}
                                >
                                    {editingChatId === chat._id ? (
                                        <Box
                                            ref={editRef}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            <OutlinedInput
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                size="small"
                                                sx={{flexGrow: 1, ml: -1}}
                                            />
                                            <Tooltip title="Save title" placement="bottom">
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Ngăn chọn chat
                                                        handleSaveTitle(chat._id);
                                                    }}
                                                >
                                                    <SaveIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : (
                                        <>
                                            <ListItemText
                                                primary={chat.title || 'Untitled Chat'}
                                                primaryTypographyProps={{
                                                    sx: {
                                                        flexGrow: 1,
                                                        minWidth: 0, // Tránh tràn ra ngoài
                                                        overflow: 'hidden', //Giới hạn title
                                                        textOverflow: 'ellipsis', //Thêm dấu ...
                                                        whiteSpace: 'nowrap', //Không ngắt dòng
                                                    }, //primaryTypographyProps cho phép tùy chỉnh trực tiếp Typography được render cho primary trong ListItemText
                                                }}
                                            />
                                            {/* Sửa: Chỉ hiển thị nút Edit/Delete khi hover */}
                                            <Box
                                                sx={{
                                                    display: 'none',
                                                    flexShrink: 0, // Không co lại khi xuất hiện
                                                    '.MuiListItem-root:hover &': {display: 'flex'}, // Kích hoạt từ ListItem cha
                                                }}
                                            >
                                                <Tooltip title="Edit title" placement="bottom">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Ngăn chọn chat khi nhấn Edit
                                                            startEditChat(chat._id, chat.title);
                                                        }}
                                                        sx={{mr: 1}}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete chat" placement="bottom">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Ngăn chọn chat khi nhấn X
                                                            handleDeleteChat(chat._id);
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </div>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        gap: 2,
                        py: 8,
                        transition: 'all .3s ease',
                    }}
                >
                    {/* Icon Logo */}
                    <Tooltip title="Home" placement="right">
                        <IconButton>
                            {config?.logoImage ? (
                                <img
                                    src={config.logoImage}
                                    alt="KT SpeakUp Logo"
                                    style={{
                                        width: '32px',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                    }}
                                />
                            ) : (
                                <HomeIcon sx={{fontSize: '32px', color: 'primary.main'}} />
                            )}
                        </IconButton>
                    </Tooltip>

                    {/* Nút tạo chat mới */}
                    <Tooltip title="Create new chat" placement="right">
                        <IconButton onClick={() => navigate('/')} sx={{mb: 2}}>
                            <AddIcon sx={{fontSize: '32px', color: 'primary.main'}} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Nút toggle ẩn/hiện sidebar */}
            <Tooltip title={isOpen ? 'Close Left Sidebar' : 'Open Left Sidebar'} placement="right">
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 20,
                        right: isOpen ? 0 : 5,
                        transition: 'left 0.3s ease',
                        zIndex: 1000,
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronLeftIcon
                        sx={{
                            fontSize: '32px',
                            color: 'primary.main',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(-180deg)',
                            transition: 'transform 0.6s ease',
                        }}
                    />
                </IconButton>
            </Tooltip>

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

            <ToastContainer position="bottom-left" autoClose={2500} />
        </Box>
    );
}

export default LeftSidebar;
