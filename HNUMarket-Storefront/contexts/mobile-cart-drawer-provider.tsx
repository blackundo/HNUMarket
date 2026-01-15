"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface MobileCartDrawerContextValue {
    isOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

const MobileCartDrawerContext = createContext<MobileCartDrawerContextValue | undefined>(undefined);

export function MobileCartDrawerProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDrawer = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <MobileCartDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
            {children}
        </MobileCartDrawerContext.Provider>
    );
}

export function useMobileCartDrawer() {
    const context = useContext(MobileCartDrawerContext);
    if (context === undefined) {
        throw new Error("useMobileCartDrawer must be used within a MobileCartDrawerProvider");
    }
    return context;
}
