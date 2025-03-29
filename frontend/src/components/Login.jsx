import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Alert,
    Link as MuiLink,
    FormControlLabel,
    Switch,
} from '@mui/material';

function Login({setToken, setUserEmail}) {
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

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, formData, {
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
    return (
        <Grid container>
            {/* Bên trái: Hình ảnh minh họa */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        backgroundImage:
                            'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop")', // Hình minh họa
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderTopLeftRadius: 40,
                        borderBottomLeftRadius: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        p: 4,
                        position: 'relative',
                        '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.3)', // Overlay để làm nổi bật text
                            zIndex: 1,
                            borderTopLeftRadius: 40,
                            borderBottomLeftRadius: 40,
                        },
                    }}
                >
                    <Box
                        sx={{
                            zIndex: 2,
                            position: 'relative',
                        }}
                    >
                        <Typography variant="h4" align="center" gutterBottom>
                            Welcome back
                        </Typography>
                        <Typography variant="body1">Enter your email and password to sign in</Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Bên phải: Form login */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        p: 4,
                    }}
                >
                    <Typography variant="h5" align="center" gutterBottom>
                        Login
                    </Typography>
                    <form onSubmit={handleLogin}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Remember me"
                            sx={{mt: 1}}
                        />
                        {error && (
                            <Alert severity="error" sx={{mt: 2}}>
                                {error}
                            </Alert>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontSize: '1rem',
                            }}
                        >
                            Login
                        </Button>
                    </form>
                    <Typography
                        align="center"
                        sx={{
                            mt: 2,
                        }}
                    >
                        Don't have an account?&nbsp;
                        <MuiLink component={Link} to="/register" color="primary">
                            Register here
                        </MuiLink>
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default Login;
