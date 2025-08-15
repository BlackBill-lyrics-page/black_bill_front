export type CropRect = { x: number; y: number; width: number; height: number };

export async function getCroppedBlob(src: string, crop: CropRect, mime = "image/jpeg", quality = 0.92) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // img.crossOrigin = "anonymous"; // 외부 이미지 다룰 때 필요하면 주석 해제
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height, // 원본에서 자를 영역
    0, 0, canvas.width, canvas.height        // 캔버스에 붙일 위치/크기 -> 캔버스 전체 꽉 채움
  );

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve((b as Blob) ?? new Blob()), mime, quality);
  });
  return blob;
}
