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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false); // State cho checkbox
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [termOpen, setTermOpen] = useState(false);
    const navigate = useNavigate();

    const handleTermOpen = () => setTermOpen(true);
    const handleTermClose = () => setTermOpen(false);

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
                                    <MuiLink
                                        component="button"
                                        type="button"
                                        onClick={handleTermOpen}
                                        color="primary"
                                        underline="hover"
                                        sx={{cursor: 'pointer'}}
                                    >
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

            {/* Dialog hiển thị Terms and Conditions */}
            <Dialog
                open={termOpen}
                onClose={handleTermClose}
                maxWidth="md"
                fullWidth
                scroll="paper"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        color: 'white',
                    }}
                >
                    Terms and Conditions
                    <IconButton edge="end" color="inherit" onClick={handleTermClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{py: 3}}>
                    <Typography variant="h6" gutterBottom color="primary">
                        1. Acceptance of Terms
                    </Typography>
                    <Typography paragraph>
                        By accessing or using our services, you agree to be bound by these Terms. If you disagree with
                        any part, you may not access the service.
                    </Typography>

                    <Divider sx={{my: 2}} />

                    <Typography variant="h6" gutterBottom color="primary">
                        2. User Responsibilities
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="• Provide accurate registration information" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="• Maintain password confidentiality" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="• Notify us immediately of unauthorized use" />
                        </ListItem>
                    </List>

                    <Divider sx={{my: 2}} />

                    <Typography variant="h6" gutterBottom color="primary">
                        3. Prohibited Activities
                    </Typography>
                    <Typography paragraph>You may not:</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="• Violate any laws" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="• Harass other users" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="• Upload malicious content" />
                        </ListItem>
                    </List>

                    <Divider sx={{my: 2}} />

                    <Typography variant="h6" gutterBottom color="primary">
                        4. Privacy Policy
                    </Typography>
                    <Typography paragraph>Your data is handled according to our Privacy Policy. We collect:</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText primary="• Email address for account creation" />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="• Usage data to improve services" />
                        </ListItem>
                    </List>
                </DialogContent>

                <DialogActions sx={{p: 3}}>
                    <Button onClick={handleTermClose} variant="contained" color="primary" fullWidth>
                        I Understand
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}

export default Register;
