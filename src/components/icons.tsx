
import type { SVGProps } from "react";

export const TradeFlowLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" stroke="none" />
        <path
            d="M9 16V8h8"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.5"
        />
        <path
            d="M9 12h5"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.5"
        />
    </svg>
);
