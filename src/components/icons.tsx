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
    <path d="M9 3h12" />
    <path d="M15 3v12" />
    <path d="M9 15h6" />
    <path d="M4 21V9a2 2 0 0 1 2-2h3" />
  </svg>
);
