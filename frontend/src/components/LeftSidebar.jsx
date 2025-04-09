import React, {useState, useEffect, useRef} from 'react';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import useSiteConfig from '../hooks/useSiteConfig';
import useConfirmDialog from '../hooks/useConfirmDialog';
import ConfirmDialog from './ConfirmDialog';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS của thư viện toastify
import axios from '../axiosInstance';

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
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home'; // sau này thay logo

function LeftSidebar({onSelectChat, refreshChatsCallback, selectedChatId}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Kiểm tra nếu là thiết bị di động
    const [isOpen, setIsOpen] = useState(!isMobile); // Mở rộng trên desktop, thu nhỏ trên mobile

    const {config, loading, error} = useSiteConfig();
    const [chats, setChats] = useState([]);
    const [editingChatId, setEditingChatId] = useState(null); // Theo dõi chat đang sửa
    const [editTitle, setEditTitle] = useState(''); // Lưu title đang chỉnh sửa
    const [searchChatTitle, setSearchChatTitle] = useState(''); // State cho ô tìm kiếm
    const navigate = useNavigate();
    const editRef = useRef(null); // Ref để kiểm tra click ngoài
    const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog

    // Lấy danh sách chat từ backend
    const fetchChats = async () => {
        try {
            const res = await axios('/chats');
            setChats(res.data.chats || res.data); // Thêm fallback nếu backend trả trực tiếp mảng
        } catch (err) {
            console.error('Error fetching chats:', err.response?.data || err.message);
            setChats([]); // Đặt rỗng nếu lỗi
        }
    };

    // Hàm này được truyền ra ngoài để các component khác gọi
    const refreshChats = async () => {
        await fetchChats();
    };

    // Tạo chat mới
    const handleNewChat = async () => {
        try {
            const res = await axios.post('/chats');
            const newChatId = res.data.chat_id;
            await fetchChats(); // Cập nhật danh sách chat
            onSelectChat(newChatId); // Chọn chat mới ngay
            navigate(`/chat/${newChatId}`); // Chuyển URL
            if (refreshChatsCallback) refreshChatsCallback(); // Gọi callback nếu có
        } catch (err) {
            console.error('Error creating chat:', err.response?.data || err.message);
        }
    };

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

        const deleteChat = async (chatId) => {
            try {
                await axios.delete(`/chats/${chatId}`);
                // Cập nhật danh sách chat sau khi xóa
                setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
                if (chatId === editingChatId) setEditingChatId(null);
                // Nếu chat đang chọn bị xóa, reset onSelectChat
                onSelectChat(null);
                navigate('/chat'); // Quay về trang mặc định
                if (refreshChatsCallback) refreshChatsCallback();
            } catch (err) {
                console.error('Error deleting chat:', err.response?.data || err.message);
                toast.error('Failed to delete chat');
            }
        };
    };

    // Bắt đầu chỉnh sửa title
    const handleEditChat = (chatId, currentTitle) => {
        setEditingChatId(chatId);
        setEditTitle(currentTitle);
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
                updateChatTitle(chatId);
                hideDialog();
            },
            confirmText: 'Update',
            confirmColor: 'primary',
        });

        const updateChatTitle = async (chatId) => {
            try {
                await axios.put(
                    `/chats/${chatId}`,
                    {title: editTitle},
                    {headers: {'Content-Type': 'application/json'}}
                );
                setChats((prevChats) =>
                    prevChats.map((chat) => (chat._id === chatId ? {...chat, title: editTitle} : chat))
                );
                setEditingChatId(null); // Thoát chế độ sửa
                if (refreshChatsCallback) refreshChatsCallback();
            } catch (err) {
                console.error('Error updating title:', err.response?.data || err.message);
                toast.error('Failed to update title');
            }
        };
    };

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

    useEffect(() => {
        fetchChats();
    }, []);

    // Gọi refreshChatsCallback chỉ một lần khi mount
    useEffect(() => {
        if (refreshChatsCallback) {
            refreshChatsCallback(refreshChats);
        }
    }, [refreshChatsCallback]);

    // Lọc danh sách chat dựa trên ô tìm kiếm
    const filteredChats = chats.filter((chat) =>
        (chat.title || 'Untitled Chat').toLowerCase().includes(searchChatTitle.toLowerCase())
    );

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
                height: '100%',
                width: isOpen ? 300 : 60,
                p: isOpen ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0, // Sửa: Ngăn co giãn
                borderTopLeftRadius: 40,
                borderBottomLeftRadius: 40,
                position: 'relative',
                transition: 'width .3s ease',
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
                        <Box onClick={() => navigate('/')} sx={{width: '100px', height: '100px', cursor: 'pointer'}}>
                            <img
                                src={config?.logoImage || null}
                                alt="KT SpeakUp Logo"
                                style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center'}}
                            />
                        </Box>
                    </Box>
                    <Divider sx={{mb: 2}} />

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

                        {/* Create new chat */}
                        <Tooltip title="Create new chat">
                            <IconButton
                                color="primary"
                                onClick={() => navigate('/')}
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
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Ngăn chọn chat
                                                    handleSaveTitle(chat._id);
                                                }}
                                            >
                                                <SaveIcon fontSize="small" />
                                            </IconButton>
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
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Ngăn chọn chat khi nhấn Edit
                                                        handleEditChat(chat._id, chat.title);
                                                    }}
                                                    sx={{mr: 1}}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Ngăn chọn chat khi nhấn X
                                                        handleDeleteChat(chat._id);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
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
                    }}
                >
                    {/* Icon Logo */}
                    <Tooltip title="Home" placement="right">
                        <IconButton>
                            <HomeIcon sx={{fontSize: '2rem', color: 'primary.main'}} />
                        </IconButton>
                    </Tooltip>

                    {/* Nút tạo chat mới */}
                    <Tooltip title="Create new chat" placement="right">
                        <IconButton onClick={() => navigate('/')} sx={{mb: 2}}>
                            <AddIcon sx={{fontSize: '2rem', color: 'primary.main'}} />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Nút toggle ẩn/hiện sidebar */}
            <Tooltip title={isOpen ? 'Close Sidebar' : 'Open Sidebar'} placement="right">
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 20,
                        right: isOpen ? 0 : 5,

                        zIndex: 1000,
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <MenuOpenIcon /> : <MenuIcon sx={{fontSize: '2rem', color: 'primary.main'}} />}
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
