import React, {useState} from 'react';
import axios from 'axios';
import {Link, useNavigate} from 'react-router-dom';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Alert,
    Link as MuiLink,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false); // State cho checkbox
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validate form
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Password do not match');
            return;
        }
        if (!agree) {
            setError('Please agree to the terms and conditions');
            return;
        }

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/register`,
                {
                    email,
                    password,
                },
                {headers: {'Content-Type': 'application/json'}}
            );
            setSuccess('Registration successful! Redirecting to login page...');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAgree(false);
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError('Registration failed');
            console.error(err);
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
                            'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop")',
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
                            background: 'rgba(0, 0, 0, 0.3)',
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
                        <Typography variant="h4" gutterBottom>
                            Welcome to Chat App
                        </Typography>
                        <Typography variant="body1">Learn and chat with AI in a fun and interactive way!</Typography>
                    </Box>
                </Box>
            </Grid>

            {/* Bên phải: Form register */}
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
                        Register
                    </Typography>
                    <form onSubmit={handleRegister}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            required
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            required
                        />
                        <TextField
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            required
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    I agree to the{' '}
                                    <MuiLink href="/terms" color="primary" underline="hover">
                                        Terms and Conditions
                                    </MuiLink>
                                </Typography>
                            }
                        />

                        {error && (
                            <Alert severity="error" sx={{mt: 2}}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{mt: 2}}>
                                {success}
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
                            disabled={!agree}
                        >
                            Register
                        </Button>
                    </form>
                    <Typography align="center" sx={{mt: 2}}>
                        Already have an account?&nbsp;
                        <MuiLink component={Link} to="/" color="primary">
                            Login here
                        </MuiLink>
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default Register;
