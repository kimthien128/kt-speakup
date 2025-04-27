//components/TermsDialog.jsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const TermsDialog = ({open, onClose}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
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
                <IconButton edge="end" color="inherit" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{py: 3}}>
                <Typography variant="h6" gutterBottom color="primary">
                    1. Acceptance of Terms
                </Typography>
                <Typography paragraph>
                    By accessing or using our services, you agree to be bound by these Terms. If you disagree with any
                    part, you may not access the service.
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
                <Button onClick={onClose} variant="contained" color="primary" fullWidth>
                    I Understand
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TermsDialog;
