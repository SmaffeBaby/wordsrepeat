"use client";

import { useState } from "react";

type UploadResult = {
  publicUrl: string;
};

export function useCardImageUpload(authFetch: <T>(url: string, options?: RequestInit) => Promise<T>) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadImage(file: File | null) {
    setUploadError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Изображение должно быть до 5 МБ");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const data = await authFetch<UploadResult>("/api/uploads/card-image", {
        method: "POST",
        body: formData
      });
      setImageUrl(data.publicUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  }

  return {
    imageUrl,
    setImageUrl,
    uploadError,
    uploading,
    uploadImage
  };
}
