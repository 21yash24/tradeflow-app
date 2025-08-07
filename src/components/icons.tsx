import type { SVGProps } from "react";

export const TradeFlowLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width="256"
        height="256"
        {...props}
    >
        <path
            fill="hsl(var(--primary))"
            d="M39.6,256h176.8c21.8,0,39.6-17.8,39.6-39.6V39.6C256,17.8,238.2,0,216.4,0H39.6C17.8,0,0,17.8,0,39.6v176.8 C0,238.2,17.8,256,39.6,256z"
        />
        <g fill="hsl(var(--primary-foreground))" transform="translate(55, 50) scale(0.9)">
            <rect x="20" y="100" width="30" height="60" rx="4" />
            <rect x="65" y="60" width="30" height="100" rx="4" />
            <rect x="110" y="20" width="30" height="140" rx="4" />
        </g>
    </svg>
);