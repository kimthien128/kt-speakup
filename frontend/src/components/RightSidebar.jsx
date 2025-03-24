import React from 'react';
import {Box, Divider, Typography, Button, Avatar} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function RightSidebar({userEmail, onLogout}) {
    const handleLogoutClick = () => {
        if (window.confirm('Are you sure want to logout')) {
            onLogout();
        }
    };
    return (
        <Box
            sx={{
                height: '100%',
                bgcolor: 'background.paper',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {userEmail && (
                <Box>
                    <Avatar sx={{bgcolor: 'primary.main', mb: 1, mx: 'auto'}}>{userEmail[0].toUpperCase()}</Avatar>
                    <Typography variant="body1">Welcome, {userEmail}</Typography>
                </Box>
            )}
            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogoutClick} sx={{mt: 2}}>
                Logout
            </Button>

            <Divider sx={{mb: 2}} />
        </Box>
    );
}

export default RightSidebar;
