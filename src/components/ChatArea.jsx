import React from 'react';

function ChatArea() {
    const messages = [
        {id: 1, text: "Hi! How's your day?", sender: 'system'},
        {id: 2, text: "It's good, thanks!", sender: 'user'},
    ];
    return (
        <main className="chat-area">
            {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender === 'user' ? 'user' : 'system'}`}>
                    {message.text}
                </div>
            ))}
        </main>
    );
}

export default ChatArea;
