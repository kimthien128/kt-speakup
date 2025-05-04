//utils/imageLoader.js
//kiểm tra trạng thái tải hình ảnh
import {useEffect, useState, useRef} from 'react';

export const useImageLoadStatus = (imageConfigs = [], timeoutMs = 2000) => {
    const [imageLoadStatus, setImageLoadStatus] = useState(() =>
        Object.fromEntries(imageConfigs.map(({key}) => [key, false]))
    );

    // Lưu trạng thái đã kiểm tra để tránh lặp lại
    const checkedImages = useRef(new Set());

    useEffect(() => {
        const imagesToCheck = imageConfigs.filter(({key, url}) => url && !checkedImages.current.has(key));

        if (imagesToCheck.length === 0) return;

        const timers = [];

        imagesToCheck.forEach(({key, url}) => {
            checkedImages.current.add(key); // Đánh dấu đã kiểm tra
            const img = new Image();
            img.src = url;
            const timer = setTimeout(() => {
                setImageLoadStatus((prev) => ({...prev, [key]: false}));
            }, timeoutMs);
            timers.push(timer);
            img.onload = () => {
                clearTimeout(timer);
                setImageLoadStatus((prev) => ({...prev, [key]: true}));
            };
            img.onerror = () => {
                clearTimeout(timer);
                setImageLoadStatus((prev) => ({...prev, [key]: false}));
            };
        });

        // Cleanup timers khi unmount hoặc dependencies thay đổi
        return () => {
            timers.forEach(clearTimeout);
        };
    }, [imageConfigs, timeoutMs]);

    return imageLoadStatus;
};

//Usage
// import {useImageLoadStatus} from '../utils/imageLoader';

// // Cấu hình các hình ảnh cần kiểm tra
//     const imageConfigs = [{key: 'heroImage', url: config?.heroImage}];
//     // Sử dụng hook để kiểm tra trạng thái tải hình ảnh
//     const imageLoadStatus = useImageLoadStatus(imageConfigs, 2000);

//     backgroundImage: imageLoadStatus.heroImage
//                             ? `url(${config.heroImage})`
//                             : `url(/images/default-hero.jpg)`,
