import * as React from "react"

export const Popover = ({ children, open, onOpenChange }: any) => {
    return <div className="relative">{children}</div>
}

export const PopoverTrigger = React.forwardRef(({ asChild, children, ...props }: any, ref) => {
    return React.cloneElement(children, { ref, ...props })
})
PopoverTrigger.displayName = "PopoverTrigger"

export const PopoverContent = React.forwardRef(({ className, align, children, ...props }: any, ref) => {
    return (
        <div ref={ref} className={`absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className || ""}`} {...props}>
            {children}
        </div>
    )
})
PopoverContent.displayName = "PopoverContent"
