import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import VocabSidebar from './components/VocabSidebar';

function App() {
    return (
        <div className="App">
            <Navbar />
            <div className="main-container">
                <HistorySidebar />
                <div className="content">
                    <InputArea />
                </div>
                <VocabSidebar />
            </div>
        </div>
    );
}

export default App;
