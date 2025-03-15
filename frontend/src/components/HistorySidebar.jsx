import React, {useState, useEffect} from 'react';

function HistorySidebar({onSelectChat}) {
    const [chats, setChats] = useState([]);
    const [newChatTitle, setNewChatTitle] = useState('');

    // Lấy danh sách chat từ backend
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/chats`, {credentials: 'include'})
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
                        <span>{chat.title}</span>
                        <button onClick={() => handleDeleteChat(chat._id)}>X</button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export default HistorySidebar;
