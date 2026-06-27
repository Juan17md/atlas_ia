import * as React from "react";
import { cn } from "@/lib/utils";

export function Isologo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="300"
      height="80"
      viewBox="0 0 300 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
      {...props}
    >
      <circle cx="30" cy="40" r="18" stroke="#FF0000" strokeWidth="3" />
      <circle cx="30" cy="40" r="25" stroke="white" strokeWidth="1" strokeDasharray="4 2" />
      <text x="65" y="48" fill="white" style={{ font: "bold italic 28px Arial, sans-serif" }}>Atlas</text>
      <text x="145" y="48" fill="#FF0000" style={{ font: "bold italic 28px Arial, sans-serif" }}>IA</text>
    </svg>
  );
}
