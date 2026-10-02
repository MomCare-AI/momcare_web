/** Limits for uploaded registration documents. Mirrored server-side by the API. */
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;

/** Returns an error message, or null when the file is acceptable. */
export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_EXT.test(file.name) || !ALLOWED_MIME.has(file.type)) {
    return "Upload a PDF, JPG or PNG file.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > DOCUMENT_MAX_BYTES) {
    return `File is too large (max ${DOCUMENT_MAX_BYTES / 1024 / 1024} MB).`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
