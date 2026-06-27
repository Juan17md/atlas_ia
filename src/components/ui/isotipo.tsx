import * as React from "react";
import { cn } from "@/lib/utils";

export function Isotipo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
      {...props}
    >
      <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
      <circle cx="50" cy="50" r="30" stroke="#FF0000" strokeWidth="6" />
      <path d="M40 50L47 57L60 43" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="10" width="4" height="10" fill="white" />
      <rect x="48" y="80" width="4" height="10" fill="white" />
    </svg>
  );
}
