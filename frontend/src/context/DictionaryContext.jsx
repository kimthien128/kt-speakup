//context/DictionaryContext.js
// quản lý state dictionarySource toàn cục
import React, {createContext, useContext, useState} from 'react';

const DictionaryContext = createContext();

export const DictionaryProvider = ({children}) => {
    const [dictionarySource, setDictionarySource] = useState('dictionaryapi'); // local or api

    return (
        <DictionaryContext.Provider value={{dictionarySource, setDictionarySource}}>
            {children}
        </DictionaryContext.Provider>
    );
};
export const useDictionary = () => useContext(DictionaryContext);
