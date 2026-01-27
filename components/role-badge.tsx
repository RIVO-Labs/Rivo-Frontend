'use client';

import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
    className?: string;
    showIcon?: boolean;
}

export function RoleBadge({ className, showIcon = true }: RoleBadgeProps) {
    const { user } = useAuth();
    const role = user?.role || 'freelancer';
    const isFreelancer = role === 'freelancer';

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1.5',
                isFreelancer
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                className
            )}
        >
            {showIcon && (
                isFreelancer ? (
                    <Briefcase className="h-3 w-3" />
                ) : (
                    <Building2 className="h-3 w-3" />
                )
            )}
            <span className="capitalize">{role}</span>
        </Badge>
    );
}
