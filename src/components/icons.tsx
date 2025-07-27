import type { SVGProps } from "react";

export const TradeFlowLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M8 4v1.5" />
        <path d="M8 14v6" />
        <rect x="6" y="5.5" width="4" height="8.5" rx="1" />
        <path d="M16 4v5.5" />
        <path d="M16 15v5" />
        <rect x="14" y="9.5" width="4" height="5.5" rx="1" />
    </svg>
);