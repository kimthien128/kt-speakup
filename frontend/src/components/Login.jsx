import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import useSiteConfig from '../hooks/useSiteConfig';
import axios from 'axios';

import {Box, Grid, TextField, Button, Typography, Link as MuiLink, FormControlLabel, Switch} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

function Login({setToken, setUserEmail}) {
    const {config, loading: configLoading, error: configError} = useSiteConfig();
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

    // Xử lý config
    if (configLoading) {
        return <CircularProgress />;
    }
    if (configError) {
        return <Alert severity="error">{configError}</Alert>;
    }

    return (
        <Grid container>
            {/* Bên trái: Hình ảnh minh họa */}
            <Grid item xs={12} md={6}>
                <Box
                    sx={{
                        height: '100%',
                        backgroundImage: config?.heroImage
                            ? `url(${config.heroImage})`
                            : 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        borderTopLeftRadius: 40,
                        borderBottomLeftRadius: 40,
                        display: 'flex',
                        // alignItems: 'end',
                        justifyContent: 'center',
                        color: 'white',
                        p: 4,
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
