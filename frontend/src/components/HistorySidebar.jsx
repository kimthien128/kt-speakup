import React, {useState, useEffect} from 'react';

function HistorySidebar({onSelectChat}) {
    const [chats, setChats] = useState([]);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [editingChatId, setEditingChatId] = useState(null); // Theo dõi chat đang sửa
    const [editTitle, setEditTitle] = useState(''); // Lưu title đang chỉnh sửa

    // Lấy danh sách chat từ backend
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/chats`, {
            credentials: 'include',
            headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch chats');
                return res.json();
            })
            .then((data) => setChats(Array.isArray(data) ? data : [])) // Đảm bảo data là array
            .catch((err) => {
                console.error('Error fetching chats:', err);
                setChats([]); // Nếu lỗi, giữ chats là array rỗng
            });
    }, []);

    // Tạo chat mới
    const createChat = async () => {
        if (!newChatTitle) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chats`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title: newChatTitle}),
                credentials: 'include',
            });
            const data = await res.json();
            setChats([...chats, {_id: data.chat_id, title: newChatTitle}]);
            setNewChatTitle('');
            onSelectChat(data.chat_id); // Chọn chat mới ngay
        } catch (err) {
            console.error('Error creating chat:', err);
        }
    };

    const handleDeleteChat = async (chatId) => {
        if (!confirm('Are you sure you want to delete chat?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chats/${chatId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete chat');

            // Cập nhật danh sách chat sau khi xóa
            setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));

            // Nếu chat đang chọn bị xóa, reset onSelectChat
            onSelectChat(null);
        } catch (err) {
            console.error('Error deleting chat:', err);
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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chats/${chatId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title: editTitle}),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to update title');
            setChats((prevChats) =>
                prevChats.map((chat) => (chat._id === chatId ? {...chat, title: editTitle} : chat))
            );
            setEditingChatId(null); // Thoát chế độ sửa
        } catch (err) {
            console.error('Error updating title:', err);
            alert('Failed to update title');
        }
    };
    return (
        <aside className="history-sidebar">
            <h3>Chat history</h3>
            <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="New chat title"
            />
            <button onClick={createChat}>Create Chat</button>
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
                                <span>{chat.title}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Ngăn chọn chat khi nhấn Edit
                                        handleEditChat(chat._id, chat.title);
                                    }}
                                >
                                    Edit
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
