import React from 'react';

function Navbar({onLogout, userEmail}) {
    const handleLogoutClick = () => {
        if (window.confirm('Are you sure want to logout')) {
            onLogout();
        }
    };
    return (
        <nav>
            <span>KT SpeakUp</span>
            {userEmail && <span>Welcome {userEmail}</span>}
            <button onClick={handleLogoutClick}>Logout</button>
        </nav>
    );
}

export default Navbar;
