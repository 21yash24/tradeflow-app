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
        <path d="M8 3v3a2 2 0 0 1-2 2H3" />
        <path d="M21 3v3a2 2 0 0 0-2 2h-3" />
        <path d="M3 16h3a2 2 0 0 0 2-2v-3" />
        <path d="M21 16h-3a2 2 0 0 1-2-2v-3" />
        <path d="M8 21v-3a2 2 0 0 0-2-2H3" />
        <path d="M13.5 8.5 16 6" />
        <path d="m8 18 2.5-2.5" />
        <path d="M13.5 15.5 16 18" />
        <path d="m8 6 2.5 2.5" />
    </svg>
);
