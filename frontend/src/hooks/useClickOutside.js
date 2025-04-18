// hooks/useClickOutside.js
// Quản lý sự kiện click ra ngoài một phần tử

import {useEffect} from 'react';

export const useClickOutside = (refs, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            // console.log(
            //     'refs:',
            //     refs.map((ref) => ref.current)
            // );

            // Lọc các ref có ref.current tồn tại
            const validRefs = refs.filter((ref) => ref.current);

            // Nếu không có ref nào hợp lệ, không làm gì
            if (validRefs.length === 0) {
                return;
            }

            // Kiểm tra xem click có nằm ngoài tất cả các validRefs không
            const isOutside = validRefs.every(
                (ref) =>
                    ref.current && !ref.current.contains(event.target) && !event.target.closest('.MuiTooltip-popper')
            );
            if (isOutside) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [refs, callback]);
};
