/** Triggers a browser download for a blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** e.g. "patient-report-2026-10-08.csv" */
export function datedFileName(base: string, extension: string, date = new Date()): string {
  // Local date (not UTC) so the file name matches the clinic's calendar day.
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${base}-${stamp}.${extension}`;
}
