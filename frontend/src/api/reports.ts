import { apiClient } from "./client";

export async function downloadReport(reportId: string): Promise<void> {
  const response = await apiClient.get(`/api/reports/${reportId}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `rapport-${reportId}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
