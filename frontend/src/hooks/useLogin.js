//hooks/useLogin.js
import {useState, useEffect} from 'react';
import axios from '../axiosInstance';

const useLogin = ({setToken, setUserEmail}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false); // State cho switch
    const [error, setError] = useState('');

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
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // Gửi email như username
            formData.append('password', password);

            const res = await axios.post('/auth/login', formData, {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            });
            const token = res.data.access_token;
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
        } catch (err) {
            setError('Invalid credentials');
            console.error('Login error:', err.response?.data || err.message);
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
        handleLogin,
    };
};
export default useLogin;
