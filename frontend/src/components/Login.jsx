import React, {useState} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';

function Login({setToken, setUserEmail}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // Gửi email như username
            formData.append('password', password);

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, formData, {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            });
            const token = res.data.access_token;
            localStorage.setItem('token', token);
            setToken(token);
            setUserEmail(email);
            setError('');
        } catch (err) {
            setError('Invalid credentials');
            console.error('Login error:', err.response?.data || err.message);
        }
    };
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit">Login</button>
            </form>
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
            {error && <p>{error}</p>}
        </div>
    );
}

export default Login;
