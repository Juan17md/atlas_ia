"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 relative", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 relative",
                month: "space-y-0 w-full relative",
                month_caption: "flex justify-center pt-1 relative items-center mb-8",
                caption_label: "text-sm font-black text-white uppercase tracking-widest",
                nav: "flex items-center justify-between w-full absolute top-0 left-0 right-0 px-2",
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 opacity-60 hover:opacity-100 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 shadow-lg"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 opacity-60 hover:opacity-100 text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 shadow-lg"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "grid grid-cols-7 mb-4",
                weekday: "text-neutral-500 rounded-md w-full font-black text-[0.7rem] text-center uppercase tracking-widest",
                week: "grid grid-cols-7 w-full mt-2",
                day: "h-10 sm:h-12 w-full text-center text-sm p-0 m-0 relative flex items-center justify-center text-white",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 sm:h-11 sm:w-11 p-0 font-bold aria-selected:opacity-100 text-inherit hover:bg-white/10 rounded-2xl transition-all duration-300"
                ),
                range_end: "day-range-end",
                selected: "bg-white !text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-110 z-20 transition-all font-black rounded-2xl",
                today: "bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl",
                outside: "text-neutral-500 opacity-20 aria-selected:bg-neutral-800/50 aria-selected:text-neutral-500",
                disabled: "text-neutral-600 opacity-30",
                range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className, ...props }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
                    return <Icon className={cn("h-5 w-5", className)} {...props} />;
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
