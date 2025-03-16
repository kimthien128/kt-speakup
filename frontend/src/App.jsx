import React, {useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import VocabSidebar from './components/VocabSidebar';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(''); // Lưu email để hiển thị user đăng nhập
    const [selectedChatId, setSelectedChatId] = useState(null);
    const onSendMessageRef = useRef(null);

    // Lấy email từ backend khi có token
    useEffect(() => {
        const fetchUserEmail = async () => {
            if (token) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
                        headers: {Authorization: `Bearer ${token}`},
                    });
                    setUserEmail(res.data.email);
                } catch (err) {
                    console.error('Error fetching user email:', err.response?.data || err.message);
                    handleLogout(); // Logout nếu token không hợp lệ
                }
            }
        };
        fetchUserEmail();
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUserEmail(''); // Xóa email khi logout
    };

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId); // Lưu chat_id được chọn
        console.log('Selected chat:', chatId);
    };

    const handleWordClick = (word, event) => {
        console.log('Clicked word:', word, 'at', event.pageX, event.pageY);
    };

    // Nếu không có token, hiển thị Router với Login/Register
    if (!token) {
        return (
            <Router>
                <Routes>
                    <Route path="/" element={<Login setToken={setToken} setUserEmail={setUserEmail} />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </Router>
        );
    }

    // Nếu có token, hiển thị giao diện chính
    return (
        <Router>
            <div className="App">
                <Navbar onLogout={handleLogout} userEmail={userEmail} />
                <div className="main-container">
                    <HistorySidebar onSelectChat={handleSelectChat} />
                    <div className="content">
                        <ChatArea
                            chatId={selectedChatId}
                            onWordClick={handleWordClick}
                            onSendMessage={onSendMessageRef}
                        />
                        <InputArea chatId={selectedChatId} onSendMessage={onSendMessageRef.current} />
                    </div>
                    <VocabSidebar />
                </div>
            </div>
        </Router>
    );
}

export default App;
