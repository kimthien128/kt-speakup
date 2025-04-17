// Hàm làm sạch tên file để tránh lỗi khi tải lên minio
export const sanitizeFilename = (filename) => {
    // Thay thế các ký tự không hợp lệ bằng '_'
    let sanitized = filename.replace(/[^\w\s.-]/g, '_');
    // Thay khoảng trắng bằng '_'
    sanitized = sanitized.replace(/\s+/g, '_');
    return sanitized;
};
