// src/components/mobile/MobileHeader.tsx
// Sticky header for mobile with menu toggle and title

import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileHeaderProps {
    title?: string;
    showBack?: boolean;
    onMenuClick?: () => void;
    rightAction?: React.ReactNode;
}

export function MobileHeader({
    title,
    showBack = false,
    onMenuClick,
    rightAction
}: MobileHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine title based on current route
    const getTitle = () => {
        if (title) return title;

        const path = location.pathname;
        if (path === '/study' || path === '/') return 'MyStudySpace';
        if (path === '/explore') return 'Explore';
        if (path === '/notices') return 'Notifications';
        if (path === '/profile') return 'Profile';
        if (path.startsWith('/chatroom')) return 'Chatroom';
        if (path.startsWith('/messages')) return 'Messages';
        return 'MyStudySpace';
    };

    return (
        <header className="md:hidden sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left side - Menu or Back */}
                <div className="flex items-center">
                    {showBack ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="mr-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    ) : onMenuClick ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onMenuClick}
                            className="mr-2"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    ) : null}

                    <h1 className="text-lg font-semibold truncate">{getTitle()}</h1>
                </div>

                {/* Right side - Optional action */}
                {rightAction && (
                    <div className="flex items-center">
                        {rightAction}
                    </div>
                )}
            </div>
        </header>
    );
}

export default MobileHeader;
