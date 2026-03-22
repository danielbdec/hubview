'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
        };

        // Set initial value
        handleChange(mql);

        // Listen for changes
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
}
