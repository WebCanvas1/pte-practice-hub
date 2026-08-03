import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const moduleIcons: Record<"mic" | "book-open" | "pen-line" | "headphones", LucideIcon> = {
  mic: Mic,
  "book-open": BookOpen,
  "pen-line": PenLine,
  headphones: Headphones,
};
