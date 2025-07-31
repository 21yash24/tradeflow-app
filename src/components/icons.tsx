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
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="hsl(var(--primary))" stroke="none" />
        <path d="M7 13.151C8.667 11.485 10.333 14.151 12 13.151S15.333 10.485 17 12.151" stroke="hsl(var(--primary-foreground))" strokeWidth="2" />
        <path d="M7 10.151C8.667 8.485 10.333 11.151 12 10.151S15.333 7.485 17 9.151" stroke="hsl(var(--primary-foreground))" strokeWidth="2" />
    </svg>
);
