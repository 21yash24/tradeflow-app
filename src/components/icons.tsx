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
        <path d="M7 12l3-3 3 3 4-4" />
        <path d="M7 17l3-3 3 3 4-4" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
);
