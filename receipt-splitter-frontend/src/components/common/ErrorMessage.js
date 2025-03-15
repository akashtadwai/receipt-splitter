import React from 'react';

const ErrorMessage = ({ message }) => {
    if (!message) return null;

    return (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
            <p className="font-medium">{message}</p>
        </div>
    );
};

export default ErrorMessage;
