import React from 'react';
import classNames from 'classnames';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
    return (
        <div
        className={classNames(
            'bg-gray-900 bg-opacity-80 border border-gray-700 rounded-lg p-4 shadow-lg',
            'text-white font-aldrich text-sm',
            'transition-all duration-200 hover:bg-opacity-90',
            className
        )}
        onClick={onClick}
        >
        {children}
        </div>
    );
};