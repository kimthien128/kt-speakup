//components/UserManagement.jsx
//sẽ cung cấp giao diện và chức năng để quản lý danh sách người dùng, bao gồm các thao tác như xem danh sách, chỉnh sửa thông tin, xóa user, và có thể thêm user mới
import React, {useState, useEffect} from 'react';
import axios from '../axiosInstance';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Box,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from './ConfirmDialog';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editDialog, setEditDialog] = useState({open: false, user: null});
    const [createDialog, setCreateDialog] = useState({open: false, user: null});
    const [confirmDialog, setConfirmDialog] = useState({open: false, userId: null});

    // State cho form tạo user mới
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        displayName: '',
        isAdmin: false,
    });

    // State cho lỗi validation của form tạo user
    const [createErrors, setCreateErrors] = useState({
        email: '',
        password: '',
        displayName: '',
    });

    // State cho lỗi validation của form chỉnh sửa user
    const [editErrors, setEditErrors] = useState({
        email: '',
        displayName: '',
    });

    // Fetch users khi component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await axios.get('/users');
                setUsers(res.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load users');
                console.error('Error fetching users:', err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Hàm validate form tạo user
    const validateCreateForm = () => {
        const errors = {
            email: '',
            password: '',
            displayName: '',
        };
        let isValid = true;

        //validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!createForm.email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!emailPattern.test(createForm.email)) {
            errors.email = 'Please enter a valid email address (e.g., user@example.com)';
            isValid = false;
        }

        //validate password
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!createForm.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (!passwordPattern.test(createForm.password)) {
            errors.password =
                'Password must be at least 8 characters long and contain at least one number, one lowercase letter, and one uppercase letter';
            isValid = false;
        }

        //validate displayName
        if (createForm.displayName && createForm.displayName.trim() === '') {
            errors.displayName = 'Display Name cannot be empty if provided';
            isValid = false;
        }
        setCreateErrors(errors);
        return isValid;
    };

    // Hàm validate form chỉnh sửa user
    const validateEditForm = (updatedUser) => {
        const errors = {
            email: '',
            displayName: '',
        };
        let isValid = true;

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!updatedUser.email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!emailPattern.test(updatedUser.email)) {
            errors.email = 'Please enter a valid email address (e.g., user@example.com)';
            isValid = false;
        }

        // Validate displayName
        if (updatedUser.displayName && updatedUser.displayName.trim() === '') {
            errors.displayName = 'Display Name cannot be empty if provided';
            isValid = false;
        }

        setEditErrors(errors);
        return isValid;
    };

    // Handle edit user
    const handleEditUser = async (updatedUser) => {
        const isValid = validateEditForm(updatedUser);
        if (!isValid) return;

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await axios.patch(`/users/${updatedUser.id}`, updatedUser);
            setUsers(users.map((u) => (u.id === updatedUser.id ? res.data : u)));
            setSuccess('User updated successfully');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update user');
            console.error('Error updating user:', err.response?.data || err.message);
        } finally {
            setLoading(false);
            setEditDialog({open: false, user: null});
            setEditErrors({
                email: '',
                displayName: '',
            });
        }
    };

    // Handle create user
    const handleCreateUser = async () => {
        const isValid = validateCreateForm();
        if (!isValid) return;

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await axios.post('/users', createForm);
            setUsers([...users, res.data]);
            setSuccess('User created successfully');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user');
            console.error('Error creating user:', err.response?.data || err.message);
        } finally {
            setLoading(false);
            setCreateDialog({open: false, user: null});
            setCreateForm({
                email: '',
                password: '',
                displayName: '',
                isAdmin: false,
            });
            setCreateErrors({
                email: '',
                password: '',
                displayName: '',
            });
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await axios.delete(`/users/${userId}`);
            setUsers(users.filter((u) => u.id !== userId));
            setSuccess('User deleted successfully');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete user');
            console.error('Error deleting user:', err.response?.data || err.message);
        } finally {
            setLoading(false);
            setConfirmDialog({open: false, userId: null});
        }
    };

    // Handle edit dialog form changes
    const handleFormChange = (field, value) => {
        setEditDialog((prev) => ({
            ...prev,
            user: {...prev.user, [field]: value},
        }));
        // Xóa lỗi của field khi người dùng bắt đầu chỉnh sửa
        setEditErrors((prev) => ({
            ...prev,
            [field]: '',
        }));
    };

    // Handle create dialog form changes
    const handleCreateFormChange = (field, value) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Xóa lỗi của field khi người dùng bắt đầu chỉnh sửa
        setCreateErrors((prev) => ({
            ...prev,
            [field]: '',
        }));
    };

    // Hàm handleCopyToClipboard
    const handleCopyToClipboard = async (event, text) => {
        event.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`Copied "${text}" to clipboard!`);
        } catch (err) {
            toast.error('Failed to copy to clipboard');
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Box sx={{width: '100%'}}>
            {/* Tiêu đề và nút Create User */}
            <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                <Typography variant="h6" sx={{mb: 2}}>
                    User Management
                </Typography>

                {/* Nút Create User */}
                <Button
                    variant="contained"
                    color="primary"
                    sx={{mb: 2}}
                    onClick={() => setCreateDialog({open: true, user: null})}
                >
                    Create User
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 2}}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{mb: 2}}>
                    {success}
                </Alert>
            )}

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', my: 4}}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Display Name</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell
                                        sx={{textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 150}}
                                        onClick={(e) => handleCopyToClipboard(e, user.id)}
                                    >
                                        {user.id}
                                    </TableCell>
                                    <TableCell
                                        sx={{textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 150}}
                                        onClick={(e) => handleCopyToClipboard(e, user.email)}
                                    >
                                        {user.email}
                                    </TableCell>
                                    <TableCell>{user.displayName || 'N/A'}</TableCell>
                                    <TableCell>{user.isAdmin ? 'Admin' : 'User'}</TableCell>
                                    <TableCell>{user.status}</TableCell>
                                    <TableCell>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{whiteSpace: 'nowrap'}}>
                                        <IconButton color="primary" onClick={() => setEditDialog({open: true, user})}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => setConfirmDialog({open: true, userId: user.id})}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Edit User Dialog */}
            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog({open: false, user: null})}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    {editDialog.user && (
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 2}}>
                            <TextField
                                label="Email"
                                value={editDialog.user.email || ''}
                                onChange={(e) => handleFormChange('email', e.target.value)}
                                fullWidth
                                required
                                error={!!editErrors.email}
                                helperText={editErrors.email}
                            />
                            <TextField
                                label="Display Name"
                                value={editDialog.user.displayName || ''}
                                onChange={(e) => handleFormChange('displayName', e.target.value)}
                                fullWidth
                                error={!!editErrors.displayName}
                                helperText={editErrors.displayName}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={editDialog.user.isAdmin ? 'Admin' : 'User'}
                                    onChange={(e) => handleFormChange('isAdmin', e.target.value === 'Admin')}
                                    label="Role"
                                >
                                    <MenuItem value="User">User</MenuItem>
                                    <MenuItem value="Admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={editDialog.user.status || 'pending'}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({open: false, user: null})}>Cancel</Button>
                    <Button onClick={() => handleEditUser(editDialog.user)} variant="contained" disabled={loading}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog
                open={createDialog.open}
                onClose={() => setCreateDialog({open: false, user: null})}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create User</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 2}}>
                        <TextField
                            label="Email"
                            value={createForm.email || ''}
                            onChange={(e) => handleCreateFormChange('email', e.target.value)}
                            fullWidth
                            required
                            error={!!createErrors.email}
                            helperText={createErrors.email}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            value={createForm.password || ''}
                            onChange={(e) => handleCreateFormChange('password', e.target.value)}
                            fullWidth
                            required
                            error={!!createErrors.password}
                            helperText={createErrors.password}
                        />
                        <TextField
                            label="Display Name"
                            value={createForm.displayName || ''}
                            onChange={(e) => handleCreateFormChange('displayName', e.target.value)}
                            fullWidth
                            error={!!createErrors.displayName}
                            helperText={createErrors.displayName}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={createForm.isAdmin ? 'Admin' : 'User'}
                                onChange={(e) => handleCreateFormChange('isAdmin', e.target.value === 'Admin')}
                                label="Role"
                            >
                                <MenuItem value="User">User</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog({open: false, user: null})}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained" disabled={loading}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title="Confirm Delete"
                content="Are you sure you want to delete this user?"
                onConfirm={() => handleDeleteUser(confirmDialog.userId)}
                onCancel={() => setConfirmDialog({open: false, userId: null})}
                confirmText="Delete"
                cancelText="Cancel"
            />
            <ToastContainer position="bottom-left" autoClose={2000} />
        </Box>
    );
}
export default UserManagement;
