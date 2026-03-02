// src/context/CollegeContext.tsx
// College selection context with two-tier access system
// Policy: College domain email = FULL access, any other email = READ-ONLY
// FIX: Auto-detect college from user email domain

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase';

// College configuration
export interface College {
    id: string;
    name: string;
    domain: string;
    logoUrl?: string;
    collegeId?: string | null;
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
    selectedCollegeId: string | null;
    setCollege: (collegeId: string) => void;
    accessLevel: AccessLevel;
    isFullAccess: boolean;
    isReadOnly: boolean;
    colleges: College[];
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

function normalizeDomain(value?: string | null): string {
    return (value || '').trim().toLowerCase();
}

// Helper to get college from localStorage (stored by the college selection flow)
const getCollegeFromLocalStorage = (): College | null => {
    try {
        const stored = localStorage.getItem('selectedCollege');
        if (stored) {
            const parsed = JSON.parse(stored);
            // The selection flow stores the full college object with domain
            if (parsed && parsed.domain) {
                // Find matching college from our list or create one
                const matched = COLLEGES.find(c => c.domain === parsed.domain);
                if (matched) return matched;
                // If not in our list, create from stored data
                return {
                    id: parsed.domain,
                    name: parsed.name || 'Unknown College',
                    domain: parsed.domain,
                    collegeId: parsed.collegeId || null,
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
    const [collegeIdMap, setCollegeIdMap] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;

        const loadCollegeIds = async () => {
            try {
                const { data, error } = await supabase
                    .from('colleges')
                    .select('id, domain');

                if (error) {
                    console.error('[CollegeContext] Failed to load college IDs:', error);
                    return;
                }

                const nextMap: Record<string, string> = {};
                for (const row of data || []) {
                    const domain = normalizeDomain((row as any).domain);
                    const id = String((row as any).id || '').trim();
                    if (domain && id) {
                        nextMap[domain] = id;
                    }
                }

                if (isMounted) {
                    setCollegeIdMap(nextMap);
                }
            } catch (error) {
                console.error('[CollegeContext] Unexpected college ID lookup error:', error);
            }
        };

        loadCollegeIds();
        return () => {
            isMounted = false;
        };
    }, []);

    // FIXED: ALWAYS respect user's college SELECTION from localStorage
    // Email domain is ONLY used for ACCESS LEVEL (full vs readonly)
    // User can view any college, but only has full access to their own college
    useEffect(() => {
        // First priority: Always try to load from localStorage (user's selection)
        const savedCollege = getCollegeFromLocalStorage();

        if (savedCollege) {
            const domain = normalizeDomain(savedCollege.domain);
            setSelectedCollege({
                ...savedCollege,
                collegeId: collegeIdMap[domain] || savedCollege.collegeId || null,
            });
            console.log(`[CollegeContext] Using selected college: ${savedCollege.name} (from localStorage)`);
            return;
        }

        // Fallback: If no localStorage selection exists
        if (user?.email) {
            const userDomain = user.email.split('@')[1]?.toLowerCase();

            // Try to find a college matching user's email domain
            const matchedCollege = COLLEGES.find(c => c.domain.toLowerCase() === userDomain);

            if (matchedCollege) {
                const domain = normalizeDomain(matchedCollege.domain);
                const hydratedCollege = {
                    ...matchedCollege,
                    collegeId: collegeIdMap[domain] || null,
                };
                setSelectedCollege(hydratedCollege);
                // Also save to localStorage so it persists
                localStorage.setItem('selectedCollege', JSON.stringify(hydratedCollege));
                console.log(`[CollegeContext] No selection found, defaulting to email domain: ${matchedCollege.name}`);
                return;
            }
        }

        // Last resort: Default to first college
        const defaultCollege = {
            ...COLLEGES[0],
            collegeId: collegeIdMap[normalizeDomain(COLLEGES[0].domain)] || null,
        };
        setSelectedCollege(defaultCollege);
        console.log(`[CollegeContext] No selection found, defaulting to: ${COLLEGES[0].name}`);
    }, [user, collegeIdMap]);

    // Set college by ID (for manual selection by readonly users)
    const setCollege = (collegeId: string) => {
        const college = COLLEGES.find(c => c.id === collegeId);
        if (college) {
            const hydratedCollege = {
                ...college,
                collegeId: collegeIdMap[normalizeDomain(college.domain)] || null,
            };
            setSelectedCollege(hydratedCollege);
            // Save full college object to match selection format
            localStorage.setItem('selectedCollege', JSON.stringify(hydratedCollege));
        }
    };

    const selectedCollegeId = selectedCollege?.collegeId || null;

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
            selectedCollegeId,
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
