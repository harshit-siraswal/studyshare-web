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

    // FIXED: ALWAYS respect user's college SELECTION from localStorage
    // Email domain is ONLY used for ACCESS LEVEL (full vs readonly)
    // User can view any college, but only has full access to their own college
    useEffect(() => {
        // First priority: Always try to load from localStorage (user's selection on landing page)
        const savedCollege = getCollegeFromLocalStorage();

        if (savedCollege) {
            setSelectedCollege(savedCollege);
            console.log(`[CollegeContext] Using selected college: ${savedCollege.name} (from localStorage)`);
            return;
        }

        // Fallback: If no localStorage selection exists
        if (user?.email) {
            const userDomain = user.email.split('@')[1]?.toLowerCase();

            // Try to find a college matching user's email domain
            const matchedCollege = COLLEGES.find(c => c.domain.toLowerCase() === userDomain);

            if (matchedCollege) {
                setSelectedCollege(matchedCollege);
                // Also save to localStorage so it persists
                localStorage.setItem('selectedCollege', JSON.stringify(matchedCollege));
                console.log(`[CollegeContext] No selection found, defaulting to email domain: ${matchedCollege.name}`);
                return;
            }
        }

        // Last resort: Default to first college
        setSelectedCollege(COLLEGES[0]);
        console.log(`[CollegeContext] No selection found, defaulting to: ${COLLEGES[0].name}`);
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
