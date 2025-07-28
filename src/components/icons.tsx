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
        <path d="M2 12h5" />
        <path d="M7 7l5 5-5 5" />
        <path d="M12 2l5 5-5 5" />
        <path d="M17 7h5" />
    </svg>
);
