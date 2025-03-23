import React, {useState, useEffect} from 'react';
import axios from '../axiosInstance';
import {useNavigate} from 'react-router-dom';

function HistorySidebar({onSelectChat, refreshChatsCallback}) {
    const [chats, setChats] = useState([]);
    const [editingChatId, setEditingChatId] = useState(null); // Theo dõi chat đang sửa
    const [editTitle, setEditTitle] = useState(''); // Lưu title đang chỉnh sửa
    const navigate = useNavigate();

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
        if (!confirm('Are you sure you want to delete chat?')) return;
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
            alert('Failed to delete chat');
        }
    };

    // Bắt đầu chỉnh sửa title
    const handleEditChat = (chatId, currentTitle) => {
        setEditingChatId(chatId);
        setEditTitle(currentTitle);
    };

    // Lưu title mới
    const handleSaveTitle = async (chatId) => {
        if (!editTitle.trim()) {
            alert('Title cannot be empty');
            return;
        }

        try {
            await axios.put(`/chats/${chatId}`, {title: editTitle}, {headers: {'Content-Type': 'application/json'}});
            setChats((prevChats) =>
                prevChats.map((chat) => (chat._id === chatId ? {...chat, title: editTitle} : chat))
            );
            setEditingChatId(null); // Thoát chế độ sửa
            if (refreshChatsCallback) refreshChatsCallback();
        } catch (err) {
            console.error('Error updating title:', err.response?.data || err.message);
            alert('Failed to update title');
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    // Gọi refreshChatsCallback chỉ một lần khi mount
    useEffect(() => {
        if (refreshChatsCallback) {
            refreshChatsCallback(refreshChats);
        }
    }, [refreshChatsCallback]);

    return (
        <aside className="history-sidebar">
            <h3>Chat history</h3>
            <button onClick={handleNewChat}>New Chat</button>
            <ul>
                {chats.map((chat) => (
                    <li key={chat._id} onClick={() => onSelectChat(chat._id)}>
                        {editingChatId === chat._id ? (
                            <>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn chọn chat
                                        handleSaveTitle(chat._id);
                                    }}
                                >
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                <span>{chat.title || 'Untitled Chat'}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn chọn chat khi nhấn Edit
                                        handleEditChat(chat._id, chat.title);
                                    }}
                                >
                                    E
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn chọn chat khi nhấn X
                                        handleDeleteChat(chat._id);
                                    }}
                                >
                                    X
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export default HistorySidebar;
