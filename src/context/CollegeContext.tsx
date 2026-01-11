// src/context/CollegeContext.tsx
// College selection context with two-tier access system
// Policy: College domain email = FULL access, any other email = READ-ONLY
// FIX: Auto-detect college from user email domain

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// College configuration
export interface College {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string;
}

// All active colleges with verified domains
export const COLLEGES: College[] = [
    { id: 'kiet', name: 'Krishna Institute of Engineering and Technology', domain: 'kiet.edu' },
    { id: 'iiitbh', name: 'IIIT Bhagalpur', domain: 'iiitbh.ac.in' },
    { id: 'iiitsonepat', name: 'IIIT Sonepat', domain: 'iiitsonepat.ac.in' },
    { id: 'abes', name: 'ABES Engineering College', domain: 'abes.ac.in' },
    { id: 'du', name: 'Delhi University', domain: 'du.ac.in' },
    { id: 'du-students', name: 'Delhi University (Students)', domain: 'students.du.ac.in' },
];

type AccessLevel = 'full' | 'readonly';

interface CollegeContextType {
    selectedCollege: College | null;
    setCollege: (collegeId: string) => void;
    accessLevel: AccessLevel;
    isFullAccess: boolean;
    isReadOnly: boolean;
    colleges: College[];
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

// Helper to get college from localStorage (stored by Index.tsx as full object)
const getCollegeFromLocalStorage = (): College | null => {
    try {
        const stored = localStorage.getItem('selectedCollege');
        if (stored) {
            const parsed = JSON.parse(stored);
            // The Index.tsx stores the full college object with domain
            if (parsed && parsed.domain) {
                // Find matching college from our list or create one
                const matched = COLLEGES.find(c => c.domain === parsed.domain);
                if (matched) return matched;
                // If not in our list, create from stored data
                return {
                    id: parsed.domain,
                    name: parsed.name || 'Unknown College',
                    domain: parsed.domain,
                };
            }
        }
    } catch (e) {
        console.error('[CollegeContext] Error reading localStorage:', e);
    }
    return null;
};

export const CollegeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

    // FIX: Auto-detect college from user email domain FIRST
    // Then fallback to localStorage for users with non-college emails
    useEffect(() => {
        if (user?.email) {
            const userDomain = user.email.split('@')[1]?.toLowerCase();

            // First: Try to match college by email domain
            const matchedCollege = COLLEGES.find(c => c.domain.toLowerCase() === userDomain);

            if (matchedCollege) {
                // User has college email - auto-select and grant full access
                setSelectedCollege(matchedCollege);
                console.log(`[CollegeContext] Auto-detected college: ${matchedCollege.name} from email domain: ${userDomain}`);
                return;
            }

            // Second: For non-college emails, try to load from localStorage
            const savedCollege = getCollegeFromLocalStorage();
            if (savedCollege) {
                setSelectedCollege(savedCollege);
                console.log(`[CollegeContext] Loaded from localStorage: ${savedCollege.name} (readonly mode for ${userDomain})`);
                return;
            }

            // Third: Default to first college for users without selection
            // This ensures they can at least view content (readonly)
            setSelectedCollege(COLLEGES[0]);
            console.log(`[CollegeContext] Defaulting to: ${COLLEGES[0].name} (readonly mode)`);
        } else {
            // No user logged in - try localStorage
            const savedCollege = getCollegeFromLocalStorage();
            if (savedCollege) {
                setSelectedCollege(savedCollege);
            }
        }
    }, [user]);

    // Set college by ID (for manual selection by readonly users)
    const setCollege = (collegeId: string) => {
        const college = COLLEGES.find(c => c.id === collegeId);
        if (college) {
            setSelectedCollege(college);
            // Save full college object to match Index.tsx format
            localStorage.setItem('selectedCollege', JSON.stringify(college));
        }
    };

    // Derive access level from email domain
    // Policy: If user email ends with college domain = FULL access
    // Otherwise = READ-ONLY access
    const accessLevel: AccessLevel = (() => {
        if (!user?.email || !selectedCollege) return 'readonly';

        const userDomain = user.email.split('@')[1]?.toLowerCase();
        const collegeDomain = selectedCollege.domain.toLowerCase();

        return userDomain === collegeDomain ? 'full' : 'readonly';
    })();

    const isFullAccess = accessLevel === 'full';
    const isReadOnly = accessLevel === 'readonly';

    return (
        <CollegeContext.Provider value={{
            selectedCollege,
            setCollege,
            accessLevel,
            isFullAccess,
            isReadOnly,
            colleges: COLLEGES,
        }}>
            {children}
        </CollegeContext.Provider>
    );
};

export const useCollege = () => {
    const context = useContext(CollegeContext);
    if (!context) {
        throw new Error('useCollege must be used within a CollegeProvider');
    }
    return context;
};

export default CollegeContext;
