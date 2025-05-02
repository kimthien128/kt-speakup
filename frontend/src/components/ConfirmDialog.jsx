import {Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography} from '@mui/material';

import WarningIcon from '@mui/icons-material/Warning';

function ConfirmDialog({
    open,
    title = 'Confirm Action',
    content,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'primary',
    severity = 'warning', // 'warning', 'error', 'info', 'success'
}) {
    const getSeverityColor = () => {
        switch (severity) {
            case 'error':
                return '#f44336';
            case 'info':
                return '#2196f3';
            case 'success':
                return '#4caf50';
            default:
                return '#ff9800';
        }
    };
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            sx={{
                '& .MuiDialog-paper': {
                    minWidth: 500,
                    minHeight: 250,
                    borderRadius: 4,
                    overflow: 'hidden',
                },
            }}
            disableEnforceFocus={false}
        >
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 2,
                    px: 3,
                    bgcolor: 'background.paper',
                }}
            >
                {title}
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 3,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 2,
                    }}
                >
                    <WarningIcon
                        fontSize="large"
                        sx={{
                            color: getSeverityColor(),
                            flexShrink: 0,
                        }}
                    />
                    <Typography variant="body1" sx={{lineHeight: 1.6}}>
                        {typeof content === 'string' ? content : content}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'grey.50',
                }}
            >
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    sx={{
                        mr: 2,
                        px: 3,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    color={confirmColor}
                    // autoFocus
                    variant="contained"
                    sx={{
                        px: 3,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
