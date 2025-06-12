import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return <div className={cn("bg-gray-800 text-white p-4 rounded-lg shadow-md border border-gray-600", className)}>{children}</div>;
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
    return <div className={cn("border-b border-gray-700 pb-2 mb-2", className)}>{children}</div>;
};

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
    return <h2 className={cn("text-lg font-bold", className)}>{children}</h2>;
};

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
    return <div className={cn("text-sm", className)}>{children}</div>;
};
