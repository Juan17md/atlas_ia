"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    placeholder?: string;
    maxDate?: Date;
}

export function DatePicker({
    date,
    setDate,
    className,
    placeholder = "Seleccionar fecha",
    maxDate,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-bold h-12 bg-neutral-950 border-neutral-800 rounded-xl hover:bg-neutral-900 transition-all active:scale-[0.98]",
                        !date && "text-neutral-500",
                        className
                    )}
                >
                    <CalendarIcon className="mr-3 h-4 w-4 text-neutral-500" />
                    {date ? (
                        <span className="text-white uppercase tracking-tight">
                            {format(date, "PPP", { locale: es })}
                        </span>
                    ) : (
                        <span className="text-neutral-500">{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-auto p-0 border-none shadow-none bg-transparent" 
                align="start"
                sideOffset={8}
            >
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-neutral-950 border border-neutral-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    setDate(newDate);
                                    setOpen(false);
                                }}
                                disabled={(date) =>
                                    maxDate ? date > maxDate : false
                                }
                                initialFocus
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </PopoverContent>
        </Popover>
    );
}
