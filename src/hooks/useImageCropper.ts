import { useCallback, useEffect, useState } from "react";
import { getCroppedBlob } from "../utility/imageCrop";
import type { CropRect } from "../utility/imageCrop";

export function useImageCropper() {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null); // DataURL
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropRect | null>(null);

  // preview object URL memory freeing
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]); //Omitting return, cleanup function

  // Selecting file → Reading DataURL & opening modal
  const startFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setOpen(true);
    };
    reader.readAsDataURL(file);  //Data URL -> redaer.result
  }, []);

  // 크롭 적용 → Blob/File/미리보기 URL 반환
  const apply = useCallback(async () => {
    if (!src || !croppedAreaPixels) return null;
    const blob = await getCroppedBlob(src, croppedAreaPixels);
    const file = new File([blob], `crop-${Date.now()}.jpg`, { type: "image/jpeg" });
    const url = URL.createObjectURL(file);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(url);
    setOpen(false);
    setSrc(null);
    return { blob, file, previewUrl: url };
  }, [src, croppedAreaPixels, objectUrl]);

  const cancel = useCallback(() => { setOpen(false); setSrc(null); }, []);

  return {
    open, src, crop, setCrop, zoom, setZoom, setCroppedAreaPixels,
    startFromFile, apply, cancel,
  };
}
