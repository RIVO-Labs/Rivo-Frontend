'use client';

import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, Building2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function RoleSelector() {
    const { role, setRole, isFreelancer, isCompany } = useRole();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <motion.div
                        key={role}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isFreelancer ? (
                            <Briefcase className="h-4 w-4 text-primary" />
                        ) : (
                            <Building2 className="h-4 w-4 text-purple-500" />
                        )}
                    </motion.div>
                    <span className="hidden sm:inline">
                        {isFreelancer ? 'Freelancer' : 'Company'}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => setRole('freelancer')}
                    className="gap-2 cursor-pointer"
                >
                    <Briefcase className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                        <span className="font-medium">Freelancer</span>
                        <span className="text-xs text-muted-foreground">
                            View as a freelancer
                        </span>
                    </div>
                    {isFreelancer && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto h-2 w-2 rounded-full bg-primary"
                        />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setRole('company')}
                    className="gap-2 cursor-pointer"
                >
                    <Building2 className="h-4 w-4 text-purple-500" />
                    <div className="flex flex-col">
                        <span className="font-medium">Company</span>
                        <span className="text-xs text-muted-foreground">
                            View as a company
                        </span>
                    </div>
                    {isCompany && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto h-2 w-2 rounded-full bg-purple-500"
                        />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
