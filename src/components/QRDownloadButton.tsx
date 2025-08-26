import { useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  url: string;                 // QR에 담을 링크
  filename?: string;           // 저장 파일명
  size?: number;               // 프리뷰 크기(px)
  label?: string;              // 버튼 라벨
  className?: string;          // 외부 스타일
};

export default function QRDownloadButton({
  url,
  filename = "qr.png",
  size = 56,
  label = "QR 다운로드",
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canMake = useMemo(() => Boolean(url && url.startsWith("http")), [url]);

  useEffect(() => {
    (async () => {
      if (!canvasRef.current || !canMake) return;
      try {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
      } catch (e) {
        console.error("QR render error", e);
      }
    })();
  }, [url, size, canMake]);

  const handleDownload = () => {
    if (!canvasRef.current || !canMake) return;
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="border rounded-lg overflow-hidden bg-white"
        style={{ width: size, height: size }}
        aria-label="QR 미리보기"
      >
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!canMake}
        className={`px-3 py-2 rounded-full text-sm ${
          canMake
            ? "bg-black text-white hover:opacity-90"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        title={canMake ? url : "유효한 URL이 없습니다"}
      >
        {label}
      </button>
    </div>
  );
}
