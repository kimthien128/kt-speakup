//components/LoginForm.jsx

import React from 'react';
import {Link} from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
} from '@mui/material';

function LoginForm({email, setEmail, password, setPassword, handleLogin, error, rememberMe, setRememberMe, loading}) {
    return (
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
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1,
                    }}
                >
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
                    <MuiLink component={Link} to="/forgot-password" color="primary">
                        Fogot password?
                    </MuiLink>
                </Box>
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
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
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
    );
}

export default LoginForm;
