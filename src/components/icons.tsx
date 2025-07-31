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
       <rect width="24" height="24" rx="4" fill="#23273A"/>
       <path d="M5 10.5C8 8 10 13 12 10.5S16 8 19 10.5" stroke="#16A085" strokeWidth="2.5" />
       <path d="M5 15.5C8 13 10 18 12 15.5S16 13 19 15.5" stroke="#16A085" strokeWidth="2.5" />
    </svg>
);
