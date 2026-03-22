import { differenceInDays, startOfDay } from 'date-fns';

export type SlaStatus = 'overdue' | 'warning' | 'on-track' | null;

export function getSlaStatus(endDate?: string): SlaStatus {
    if (!endDate) return null;

    try {
        const parts = endDate.split(/[-T]/);
        // Fallback for full ISO dates vs short YYYY-MM-DD
        const end = parts.length >= 3 
            ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) 
            : new Date(endDate);
            
        // Valid date check
        if (isNaN(end.getTime())) return null;

        const today = startOfDay(new Date());
        const target = startOfDay(end);
        
        const diff = differenceInDays(target, today);
        
        if (diff < 0) return 'overdue';
        if (diff <= 3) return 'warning';
        return 'on-track';
    } catch {
        return null;
    }
}
