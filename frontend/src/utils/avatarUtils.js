// Hàm lấy chữ cái đầu tiên cho Avatar
export const getAvatarInitial = (userInfo) => {
    if (userInfo?.displayName) {
        return userInfo.displayName[0].toUpperCase();
    }
    return userInfo?.email ? userInfo.email[0].toUpperCase() : '';
};
