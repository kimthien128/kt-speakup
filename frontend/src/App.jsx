import React, {useState, useRef, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useNavigate} from 'react-router-dom';
import axios from './axiosInstance';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import VocabSidebar from './components/VocabSidebar';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function ChatPage({token, userEmail, onLogout, onSendMessageRef}) {
    const {chatId} = useParams(); // Lấy chatId từ URL
    const navigate = useNavigate();
    const [selectedChatId, setSelectedChatId] = useState(chatId);
    const refreshChatsRef = useRef(null);

    useEffect(() => {
        if (chatId && chatId !== 'undefined' && chatId !== 'null') {
            setSelectedChatId(chatId);
        } else {
            setSelectedChatId(null); // Đặt null nếu chatId không hợp lệ
        }
    }, [chatId]);

    const handleSelectChat = (newChatId) => {
        setSelectedChatId(newChatId);
        navigate(`/chat/${newChatId}`); // Cập nhật URL
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const handleWordClick = (word, event) => {
        console.log('Clicked word:', word, 'at:', event.pageX, event.pageY);
    };

    return (
        <div className="App">
            <Navbar onLogout={handleLogout} userEmail={userEmail} />
            <div className="main-container">
                <HistorySidebar
                    onSelectChat={handleSelectChat}
                    refreshChatsCallback={(fn) => (refreshChatsRef.current = fn)}
                />
                <div className="content">
                    <ChatArea chatId={selectedChatId} onWordClick={handleWordClick} onSendMessage={onSendMessageRef} />
                    <InputArea
                        chatId={selectedChatId}
                        setChatId={(newChatId) => {
                            setSelectedChatId(newChatId);
                            navigate(`/chat/${newChatId}`);
                        }}
                        onSendMessage={onSendMessageRef.current}
                        refreshChats={refreshChatsRef.current} // Truyền refreshChats vào InputArea
                    />
                </div>
                <VocabSidebar />
            </div>
        </div>
    );
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(''); // Lưu email để hiển thị user đăng nhập
    const onSendMessageRef = useRef(null);

    // Lấy email từ backend khi có token
    useEffect(() => {
        const fetchUserEmail = async () => {
            if (token) {
                try {
                    const res = await axios.get('/auth/me');
                    setUserEmail(res.data.email);
                } catch (err) {
                    console.error('Error fetching user email:', err.response?.data || err.message);
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
            <Routes>
                <Route
                    path="/chat/:chatId"
                    element={
                        <ChatPage
                            token={token}
                            userEmail={userEmail}
                            onLogout={handleLogout}
                            onSendMessageRef={onSendMessageRef}
                        />
                    }
                />
                <Route
                    path="*"
                    element={
                        <ChatPage
                            token={token}
                            userEmail={userEmail}
                            onLogout={handleLogout}
                            onSendMessageRef={onSendMessageRef}
                        />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
