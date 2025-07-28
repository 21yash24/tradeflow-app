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
       <circle cx="12" cy="12" r="10" fill="hsl(var(--primary-foreground))" stroke="none" />
       <g stroke="hsl(var(--primary))">
         <line x1="8" y1="15" x2="8" y2="10" strokeWidth="1.5" />
         <line x1="10" y1="15" x2="10" y2="12" strokeWidth="1.5" />
         <line x1="12" y1="15" x2="12" y2="9" strokeWidth="1.5" />
         <line x1="14" y1="15" x2="14" y2="13" strokeWidth="1.5" />
         <line x1="16" y1="15" x2="16" y2="11" strokeWidth="1.5" />
       </g>
    </svg>
);
