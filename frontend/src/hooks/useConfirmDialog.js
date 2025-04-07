import {useState} from 'react';

export default function useConfirmDialog() {
    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => {},
        confirmText: 'Confirm',
        confirmColor: 'primary',
    });

    const showDialog = (option) => {
        setDialog({
            open: true,
            title: option.title,
            content: option.content,
            onConfirm: option.onConfirm || (() => {}),
            confirmText: option.confirmText || 'Confirm',
            confirmColor: option.confirmColor || 'primary',
        });
    };

    const hideDialog = () => {
        setDialog((prev) => ({
            ...prev,
            open: false,
        }));
    };

    return {
        dialog,
        showDialog,
        hideDialog,
    };
}

/* Usage 
import useConfirmDialog from '../hooks/useConfirmDialog';
import ConfirmDialog from './ConfirmDialog';

const {dialog, showDialog, hideDialog} = useConfirmDialog(); // Hook sử dụng ConfirmDialog

// đặt trong hàm cần gọi
showDialog({
            title: 'Confirm Logout',
            content: 'Are you sure want to logout?',
            onConfirm: () => {
                onLogout();
                hideDialog();
            },
            confirmText: 'Logout',
            confirmColor: 'primary',
        });

//đặt dưới cùng phần return, trước thẻ đóng
//Hiển thị ConfirmDialog
<ConfirmDialog
open={dialog.open}
title={dialog.title}
content={dialog.content}
onConfirm={dialog.onConfirm}
onCancel={hideDialog}
confirmText={dialog.confirmText}
confirmColor={dialog.confirmColor}
/>

*/
