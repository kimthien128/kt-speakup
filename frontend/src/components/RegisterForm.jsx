//components/TermsDialog.jsx
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import axios from '../axiosInstance';
import TermsDialog from './TermsDialog';
import {TextField, Button, Typography, Link as MuiLink, FormControlLabel, Checkbox, Alert} from '@mui/material';

const RegisterForm = ({onSuccess}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false); // State cho checkbox
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailError, setEmailError] = useState(''); //lỗi gửi email
    const [termOpen, setTermOpen] = useState(false);

    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

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
        if (!passwordPattern.test(password)) {
            setError(
                'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter'
            );
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
            setSuccess('Registration successful! Please check your email to confirm your account.');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAgree(false);

            // Gọi callback onSuccess để gửi email và nhận kết quả
            await onSuccess();
        } catch (err) {
            if (err.response?.status === 500 && err.response?.data?.detail === 'Failed to send confirmation email') {
                setEmailError('Failed to send confirmation email. Please try again later.');
                setSuccess('');
            } else {
                setError('Registration failed: ' + (err.response?.data?.detail || err.message));
            }
            console.error(err);
        }
    };
    return (
        <>
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
                    inputProps={{
                        pattern: '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}',
                        title: 'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter',
                    }}
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
                    control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} color="primary" />}
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

            {/* Dialog hiển thị Terms and Conditions */}
            <TermsDialog open={termOpen} onClose={handleTermClose} />
        </>
    );
};
export default RegisterForm;
