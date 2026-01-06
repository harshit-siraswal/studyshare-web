// src/context/CollegeContext.tsx
// College selection context with two-tier access system
// Policy: College domain email = FULL access, any other email = READ-ONLY

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// College configuration
export interface College {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string;
}

// Predefined colleges
export const COLLEGES: College[] = [
    { id: 'kiet', name: 'KIET Group of Institutions', domain: 'kiet.edu' },
    { id: 'iiitbh', name: 'Indian Institute of Information Technology Bhagalpur', domain: 'iiitbh.ac.in' },
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

const STORAGE_KEY = 'selectedCollegeId';

export const CollegeProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

    // Initialize from localStorage
    useEffect(() => {
        const savedCollegeId = localStorage.getItem(STORAGE_KEY);
        if (savedCollegeId) {
            const college = COLLEGES.find(c => c.id === savedCollegeId);
            if (college) {
                setSelectedCollege(college);
            }
        }
    }, []);

    // Set college by ID
    const setCollege = (collegeId: string) => {
        const college = COLLEGES.find(c => c.id === collegeId);
        if (college) {
            setSelectedCollege(college);
            localStorage.setItem(STORAGE_KEY, collegeId);
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
