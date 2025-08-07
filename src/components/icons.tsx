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
        <g transform="translate(60, 50) scale(0.6)">
            <rect x="75" y="50" width="30" height="100" fill="hsl(var(--primary-foreground))" opacity="0.8" />
            <line x1="90" y1="25" x2="90" y2="50" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
            <line x1="90" y1="150" x2="90" y2="175" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
            <rect x="155" y="80" width="30" height="120" fill="hsl(var(--primary-foreground))" />
            <line x1="170" y1="50" x2="170" y2="80" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
            <line x1="170" y1="200" x2="170" y2="225" stroke="hsl(var(--primary-foreground))" strokeWidth="10" />
        </g>
    </svg>
);
