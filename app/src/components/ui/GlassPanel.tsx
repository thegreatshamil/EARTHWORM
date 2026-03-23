import React from 'react';
import clsx from 'clsx';

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    strong?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ children, className, strong = false }) => {
    const base = 'bg-white/5 border border-white/10 backdrop-blur-2xl';
    const strongClass = strong ? 'glass-strong' : 'glass';

    return (
        <div className={clsx(base, strongClass, className)}>
            {children}
        </div>
    );
};

export default GlassPanel;
