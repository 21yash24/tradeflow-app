
import type { SVGProps } from "react";

export const TradeFlowLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width="256"
        height="256"
        {...props}
    >
        <defs>
            <linearGradient id="tradeflow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(169, 85%, 26%)', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path
            d="M39.6,256h176.8c21.8,0,39.6-17.8,39.6-39.6V39.6C256,17.8,238.2,0,216.4,0H39.6C17.8,0,0,17.8,0,39.6v176.8 C0,238.2,17.8,256,39.6,256z"
            fill="url(#tradeflow-gradient)"
        />
        <path
            d="M59,165l46-48 52,32 58-64"
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="105" cy="117" r="10" fill="hsl(var(--primary-foreground))" stroke="hsl(var(--primary))" strokeWidth="4" />
    </svg>
);
