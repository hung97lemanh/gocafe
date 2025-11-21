import React, { useEffect, useRef } from "react";

type CarouselProps = {
    children: React.ReactNode;
    className?: string;
    setApi?: (api: any) => void;
    opts?: any;
};

export const Carousel: React.FC<CarouselProps> = ({ children, className, setApi }) => {
    // Minimal API to mimic an external carousel lib
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!setApi) return;

        const api = {
            scrollNext: () => {
                // noop: page controls call this
            },
            scrollTo: (i: number) => {},
            selectedScrollSnap: () => 0,
            on: (evt: string, cb: (...args: any[]) => void) => {},
            off: (evt: string, cb: (...args: any[]) => void) => {}
        };

        setApi(api);
        // no cleanup necessary for this stub
    }, [setApi]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
};

export const CarouselContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={className || ""}>{children}</div>
);

export const CarouselItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={className || ""}>{children}</div>
);

export const CarouselNext: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({ children, className, ...rest }) => (
    <button aria-label="next" className={className} {...rest}>
        {children || "Next"}
    </button>
);

export const CarouselPrevious: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({ children, className, ...rest }) => (
    <button aria-label="previous" className={className} {...rest}>
        {children || "Prev"}
    </button>
);

export default Carousel;
