'use client';

import * as React from "react"

interface DropdownMenuContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
    open: false,
    setOpen: () => {},
});

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative" ref={ref}>{children}</div>
        </DropdownMenuContext.Provider>
    );
};

const DropdownMenuTrigger = React.forwardRef<HTMLElement, any>(({ asChild, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext);
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        props.onClick?.(e);
    };
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, { ref, ...props, onClick: handleClick });
    }
    return <button ref={ref as any} {...props} onClick={handleClick}>{children}</button>;
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<HTMLDivElement, any>(({ className, align = "center", children, ...props }, ref) => {
    const { open } = React.useContext(DropdownMenuContext);
    if (!open) return null;
    return (
        <div
            ref={ref}
            className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md top-full mt-1 ${align === 'end' ? 'right-0' : ''} ${className || ""}`}
            {...props}
        >
            {children}
        </div>
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<HTMLDivElement, any>(({ className, inset, onClick, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext);
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(e);
        setOpen(false);
    };
    return (
        <div
            ref={ref}
            className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${inset ? "pl-8" : ""} ${className || ""}`}
            onClick={handleClick}
            {...props}
        />
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, any>(({ className, inset, ...props }, ref) => (
    <div ref={ref} className={`px-2 py-1.5 text-sm font-semibold ${inset ? "pl-8" : ""} ${className || ""}`} {...props} />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} className={`-mx-1 my-1 h-px bg-muted ${className || ""}`} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator }
