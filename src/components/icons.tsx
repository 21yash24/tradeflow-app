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
        <path d="M8 3H4v5" />
        <path d="M4 11h4" />
        <path d="M20 13h-4" />
        <path d="M20 21v-5h-4" />
        <path d="M4 21v-5a2 2 0 0 1 2-2h1" />
        <path d="M13 3v5a2 2 0 0 1-2 2H4" />
    </svg>
);
