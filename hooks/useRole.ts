'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '@/types/user';

const ROLE_STORAGE_KEY = 'Rivo_user_role';

export function useRole() {
    const [role, setRoleState] = useState<UserRole>('freelancer');
    const [isLoading, setIsLoading] = useState(true);

    // Load role from localStorage on mount
    useEffect(() => {
        const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
        if (storedRole && (storedRole === 'freelancer' || storedRole === 'company')) {
            setRoleState(storedRole);
        }
        setIsLoading(false);
    }, []);

    // Switch role and persist to localStorage
    const setRole = useCallback((newRole: UserRole) => {
        setRoleState(newRole);
        localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    }, []);

    // Toggle between roles
    const toggleRole = useCallback(() => {
        const newRole: UserRole = role === 'freelancer' ? 'company' : 'freelancer';
        setRole(newRole);
    }, [role, setRole]);

    // Utility functions
    const isFreelancer = role === 'freelancer';
    const isCompany = role === 'company';

    return {
        role,
        setRole,
        toggleRole,
        isFreelancer,
        isCompany,
        isLoading,
    };
}
