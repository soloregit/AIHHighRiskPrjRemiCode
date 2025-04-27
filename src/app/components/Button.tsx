'use client';

import React from 'react';
import { Icon } from 'react-feather';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    icon?: Icon;
    iconPosition?: 'start' | 'end';
    iconColor?: 'red' | 'green' | 'grey';
    iconFill?: boolean;
    buttonStyle?: 'regular' | 'action' | 'alert' | 'flush';
}

export function Button({
    label = 'Okay',
    icon = undefined,
    iconPosition = 'start',
    iconColor = undefined,
    iconFill = false,
    buttonStyle = 'regular',
    ...rest
}: ButtonProps) {
    const StartIcon = iconPosition === 'start' ? icon : null;
    const EndIcon = iconPosition === 'end' ? icon : null;

    // Build className conditionally
    const baseClasses = "flex items-center gap-2 font-mono text-xs font-normal rounded-full px-6 py-2 min-h-[42px] transition-all outline-none";

    // Button style classes
    const styleClasses = {
        regular: "bg-[#ececf1] text-[#101010] hover:bg-[#d8d8d8] disabled:text-gray-500 active:translate-y-[1px]",
        action: "bg-[#101010] text-[#ececf1] hover:bg-[#404040] disabled:text-gray-500 active:translate-y-[1px]",
        alert: "bg-red-600 text-[#ececf1] hover:bg-red-600 disabled:text-gray-500 active:translate-y-[1px]",
        flush: "bg-transparent disabled:text-gray-500 active:translate-y-[1px]"
    };

    // Icon color classes
    const getIconColorClass = () => {
        if (!iconColor) return "";
        const colorMap = {
            red: "text-[#cc0000]",
            green: "text-[#009900]",
            grey: "text-[#909090]"
        };
        return colorMap[iconColor];
    };

    const iconClasses = `${getIconColorClass()} ${iconFill ? "fill-current" : ""}`;

    return (
        <button
            data-component="Button"
            className={`${baseClasses} ${styleClasses[buttonStyle]} cursor-pointer disabled:cursor-default`}
            {...rest}
        >
            {StartIcon && (
                <span className={`flex -ml-2 ${iconClasses}`}>
                    <StartIcon size={16} />
                </span>
            )}
            <span>{label}</span>
            {EndIcon && (
                <span className={`flex -mr-2 ${iconClasses}`}>
                    <EndIcon size={16} />
                </span>
            )}
        </button>
    );
}

export default Button;