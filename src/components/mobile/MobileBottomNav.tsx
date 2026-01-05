// src/components/mobile/MobileBottomNav.tsx
// Fixed bottom navigation bar for mobile with 5 tabs

import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    path: string;
    isCenter?: boolean;
}

const navItems: NavItem[] = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/study' },
    { icon: <Search className="w-5 h-5" />, label: 'Explore', path: '/explore' },
    { icon: <Plus className="w-6 h-6" />, label: 'Post', path: '/study?upload=true', isCenter: true },
    { icon: <Bell className="w-5 h-5" />, label: 'Alerts', path: '/notices' },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: '/profile' },
];

export function MobileBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleNavClick = (item: NavItem) => {
        if (item.path === '/study?upload=true') {
            // For upload, navigate to study and trigger upload dialog
            navigate('/study', { state: { openUpload: true } });
        } else {
            navigate(item.path);
        }
    };

    const isActive = (path: string) => {
        if (path.includes('?')) {
            return false; // Don't highlight upload button
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
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
    );
}

export default MobileBottomNav;
