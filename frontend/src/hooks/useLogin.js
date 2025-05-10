//hooks/useLogin.js
import {useState, useEffect} from 'react';
import {login} from '../services/authService';
import {logger} from '../utils/logger';

const useLogin = ({setToken, setUserEmail}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false); // State cho switch
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Tự động điền email từ localStorage khi component mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setLoading(true); // Bật trạng thái loading
        setError('');
        try {
            const data = await login(email, password); // Gọi hàm đăng nhập từ authService
            const token = data.access_token;

            // Lưu token và cập nhật state
            localStorage.setItem('token', token);
            setToken(token);
            setUserEmail(email);
            setError('');

            // Xử lý "Remember Me"
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            window.location.href = '/'; // dùng href để chuyển trang và có refresh để mount lại app.jsx và set lại token
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Invalid email or password');
            console.error('Login error:', err.response?.data || err.message);
        } finally {
            setLoading(false); // Tắt trạng thái loading
        }
    };
    return {
        email,
        setEmail,
        password,
        setPassword,
        rememberMe,
        setRememberMe,
        error,
        loading,
        handleLogin,
    };
};
export default useLogin;
