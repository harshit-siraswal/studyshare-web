// src/components/mobile/MobileBottomNav.tsx
// Fixed bottom navigation bar for mobile with 5 tabs
// Hidden on auth pages

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Plus, Bell, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import UploadResourceDialog from '@/components/UploadResourceDialog';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    path: string;
    isCenter?: boolean;
    action?: 'upload';
}

const navItems: NavItem[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/study' },
    { icon: <Bookmark className="w-5 h-5" />, label: 'Bookmarks', path: '/bookmarks' },
    { icon: <Plus className="w-6 h-6" />, label: 'Share', path: '', isCenter: true, action: 'upload' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notices', path: '/notices' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Chat', path: '/chatroom' },
];

// Routes where bottom nav should be hidden
const hiddenRoutes = ['/auth'];

export function MobileBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    // Hide nav on auth pages
    if (hiddenRoutes.includes(location.pathname)) {
        return null;
    }

    const handleNavClick = (item: NavItem) => {
        if (item.action === 'upload') {
            setUploadDialogOpen(true);
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const isActive = (path: string) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavClick(item)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                                item.isCenter ? "relative -mt-4" : "",
                                isActive(item.path)
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.isCenter ? (
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg">
                                    {item.icon}
                                </div>
                            ) : (
                                <>
                                    {item.icon}
                                    <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Upload Dialog triggered by + button */}
            <UploadResourceDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
            />
        </>
    );
}

export default MobileBottomNav;
