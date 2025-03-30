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
