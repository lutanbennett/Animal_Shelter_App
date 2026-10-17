import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/** Files one photo against an enclosure (/api/photos/pending, 0218): same shape as uploadResidentPhoto's answer. */
export function uploadPendingPhoto(t: Dictionary, enclosureId: string, file: File): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos/pending");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({});
        return;
      }
      try {
        resolve({ error: JSON.parse(xhr.responseText).error ?? t.photos.uploader.uploadFailed(xhr.status) });
      } catch {
        resolve({ error: t.photos.uploader.uploadFailed(xhr.status) });
      }
    };
    xhr.onerror = () => resolve({ error: t.photos.uploader.networkError });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("enclosureId", enclosureId);
    xhr.send(formData);
  });
}
