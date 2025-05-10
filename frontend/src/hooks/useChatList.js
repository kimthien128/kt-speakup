// hooks/useChatList.js
// quản lý danh sách chat

import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {logger} from '../utils/logger';
import {fetchChatList, createChat, deleteChat, saveChatTitle} from '../services/chatsService';

export const useChatList = (onSelectChat, refreshChatsCallback) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchChatTitle, setSearchChatTitle] = useState('');
    const [editingChatId, setEditingChatId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const navigate = useNavigate();

    // Lấy danh sách chat từ backend
    const fetchChatsLocal = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchChatList();
            setChats(res || []); // Thêm fallback nếu backend trả trực tiếp mảng
            setError(null);
        } catch (err) {
            logger.error('Error fetching chats:', err.response?.data || err.message);
            setChats([]); // Đặt rỗng nếu lỗi
            setError('Failed to load chats');
        } finally {
            setLoading(false);
        }
    }, []);

    // Tạo chat mới
    const createChatLocal = useCallback(async () => {
        try {
            const newChatId = await createChat();
            await fetchChatsLocal(); // Cập nhật danh sách chat
            onSelectChat(newChatId); // Chọn chat mới ngay
            navigate(`/chat/${newChatId}`); // Chuyển URL
            if (refreshChatsCallback) refreshChatsCallback(); // Gọi callback nếu có
            return newChatId;
        } catch (err) {
            logger.error('Error creating chat:', err.response?.data || err.message);
            toast.error('Failed to create chat');
            throw err;
        }
    }, [onSelectChat, navigate, refreshChatsCallback, fetchChatsLocal]);

    // Xóa chat
    const deleteChatLocal = useCallback(
        async (chatId) => {
            try {
                await deleteChat(chatId);
                // Cập nhật danh sách chat sau khi xóa
                setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
                if (chatId === editingChatId) setEditingChatId(null);
                // Nếu chat đang chọn bị xóa, reset onSelectChat
                onSelectChat(null);
                navigate('/chat'); // Quay về trang mặc định
                if (refreshChatsCallback) refreshChatsCallback();
            } catch (err) {
                logger.error('Error deleting chat:', err.response?.data || err.message);
                toast.error('Failed to delete chat');
                throw err;
            }
        },
        [onSelectChat, navigate, refreshChatsCallback, editingChatId]
    );

    // Bắt đầu chỉnh sửa title
    const startEditChat = useCallback((chatId, currentTitle) => {
        setEditingChatId(chatId);
        setEditTitle(currentTitle);
    }, []);

    // Lưu tiêu đề mới
    const saveChatTitleLocal = useCallback(
        async (chatId) => {
            if (!editTitle.trim()) {
                toast.error('Title cannot be empty');
                return;
            }

            try {
                await saveChatTitle(chatId, editTitle);
                setChats((prevChats) =>
                    prevChats.map((chat) => (chat._id === chatId ? {...chat, title: editTitle} : chat))
                );
                setEditingChatId(null); // Thoát chế độ sửa
                if (refreshChatsCallback) refreshChatsCallback();
            } catch (err) {
                logger.error('Error updating title:', err.response?.data || err.message);
                toast.error('Failed to update title');
                throw err;
            }
        },
        [editTitle, refreshChatsCallback]
    );

    // Lọc danh sách chat dựa trên ô tìm kiếm
    const filteredChats = chats.filter((chat) =>
        (chat.title || 'Untitled Chat').toLowerCase().includes(searchChatTitle.toLowerCase())
    );

    // Tải danh sách chat khi mount
    useEffect(() => {
        fetchChatsLocal();
    }, [fetchChatsLocal]);

    // Cập nhật refreshChatsCallback
    useEffect(() => {
        if (refreshChatsCallback) {
            refreshChatsCallback(fetchChatsLocal);
        }
    }, [refreshChatsCallback, fetchChatsLocal]);

    return {
        chats,
        filteredChats,
        loading,
        error,
        searchChatTitle,
        setSearchChatTitle,
        editingChatId,
        setEditingChatId,
        editTitle,
        setEditTitle,
        createChat: createChatLocal,
        deleteChat: deleteChatLocal,
        startEditChat,
        saveChatTitle: saveChatTitleLocal,
        fetchChats: fetchChatsLocal,
    };
};
