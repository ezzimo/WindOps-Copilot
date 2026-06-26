import { apiClient } from "./client";
import type { EmailLog } from "../types";

export async function fetchEmails(): Promise<EmailLog[]> {
  const response = await apiClient.get<EmailLog[]>("/api/emails");
  return response.data;
}
