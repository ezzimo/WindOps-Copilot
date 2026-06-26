import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatRelative(dateInput: string | Date | undefined): string {
  if (!dateInput) return "Date inconnue";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Date invalide";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}
