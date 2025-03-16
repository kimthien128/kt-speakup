import React, {useState} from 'react';
import axios from 'axios';
import {Link, useNavigate} from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        // Kiểm tra password và confirmPassword có khớp không
        if (password !== confirmPassword) {
            setError('Password do not match');
            return;
        }
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/register`,
                {
                    email,
                    password,
                },
                {headers: {'Content-Type': 'application/json'}}
            );
            setError('Registration successful! Please login.');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError('Registration failed');
            console.error(err);
        }
    };
    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />
                <button type="submit">Register</button>
            </form>
            <p>
                Already have an account?<Link to="/">Login here</Link>
            </p>
            {error && <p>{error}</p>}
        </div>
    );
}

export default Register;
