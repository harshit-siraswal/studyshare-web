// src/components/mobile/MobileSidebar.tsx
// Slide-in drawer menu for mobile

import { useState, useEffect } from 'react';
import { X, Bookmark, Moon, Sun, LogOut, FileText, BookOpenCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// Per user request: Resources, Syllabus, Following, Explore Students
const menuItems = [
    { icon: FileText, label: 'Resources', path: '/study' },
    { icon: BookOpenCheck, label: 'Syllabus', path: '/study?tab=syllabus' },
    { icon: Users, label: 'Following', path: '/study?tab=following' },
    { icon: Users, label: 'Explore Students', path: '/explore' },
];

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    // Note: Route-based closing is handled by parent Sheet component

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = async () => {
        await logout();
        onClose();
        navigate('/');
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    "md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* User Profile - Clickable to go to profile */}
                {user && (() => {
                    const selectedCollege = JSON.parse(localStorage.getItem("selectedCollege") || "{}");
                    return (
                        <div
                            className="p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleNavigate('/profile')}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {user.displayName || user.email?.split('@')[0] || 'User'}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {selectedCollege?.name || 'Your College'}
                                    </p>
                                    <p className="text-xs text-primary">View Profile →</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Navigation */}
                <nav className="p-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        // Fix: Check both pathname and search params for active state
                        const currentFullPath = location.pathname + location.search;
                        const isActive = item.path.includes('?')
                            ? currentFullPath === item.path || currentFullPath.startsWith(item.path)
                            : location.pathname === item.path && !location.search;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    {/* Logout */}
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

export default MobileSidebar;
