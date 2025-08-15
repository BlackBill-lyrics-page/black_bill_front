import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

type Props = {
  open: boolean;
  imageSrc: string | null;
  crop: { x: number; y: number };
  setCrop: (c: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (n: number) => void;
  onCropComplete: (areaPixels: { x: number; y: number; width: number; height: number }) => void;
  onApply: () => void;
  onCancel: () => void;
};

export default function ImageCropModal({
  open, imageSrc, crop, setCrop, zoom, setZoom, onCropComplete, onApply, onCancel,
}: Props) {
  if (!open || !imageSrc) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-3">사진 편집</h3>

        <div className="relative w-full h-80 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => onCropComplete(areaPixels)}
            showGrid={false}
          />
          {/* 원형 가이드(시각적) */}
          <div className="pointer-events-none absolute inset-0 mx-6 my-3 rounded-full border-2 border-white/70"></div>
        </div>

        <div className="mt-4">
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={onCancel}>취소</button>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={onApply}>적용</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
