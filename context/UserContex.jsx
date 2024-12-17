'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);

    const handleUserInfo = (data, rememberDevice) => {
        setUserInfo(data);
        const expiryTime = rememberDevice ? null : new Date().getTime() + 24 * 60 * 60 * 1000;
        const userData = {
            data: data,
            expiry: expiryTime,
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('APSOQMEU', JSON.stringify(userData));
        }
    };

    const deleteUserInfo = () => {
        setUserInfo(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('APSOQMEU');
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserStr = localStorage.getItem('APSOQMEU');
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                if (storedUser.expiry && new Date().getTime() > storedUser.expiry) {
                    deleteUserInfo();
                } else {
                    setUserInfo(storedUser.data);
                }
            }
        }
    }, []);

    // Function to fetch and update user info from the server
    const fetchUserInfoFromServer = async (email) => {
        try {
            const response = await fetch(`/api/sesion/login?email=${email}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            return null;
        }
    };

    useEffect(() => {
        const checkServerUpdates = async () => {
            if (userInfo && userInfo.email) { // Check if userInfo is present
                const storedUserStr = localStorage.getItem('APSOQMEU');
                const storedUser = JSON.parse(storedUserStr);

                const data = await fetchUserInfoFromServer(userInfo.email);
                if (data) {
                    const updatedUserData = {
                        data: data.user,
                        expiry: storedUser.expiry,
                    };
                    localStorage.setItem('APSOQMEU', JSON.stringify(updatedUserData));
                    setUserInfo(data.user);
                }
            }
        };

        const intervalId = setInterval(checkServerUpdates, 60000);
        return () => clearInterval(intervalId);
    }, [userInfo]); // Add userInfo as a dependency to check when it changes

    return (
        <UserContext.Provider value={{ userInfo, handleUserInfo, deleteUserInfo }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
