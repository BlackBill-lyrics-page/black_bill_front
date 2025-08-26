import { useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import blackBillLogo from "../assets/blackBillLogo.png"; // ★ 하드코딩된 로고

type Mode = "in" | "below";

type Props = {
  url: string;
  filename?: string;
  size?: number;            // 미리보기 QR 한 변(px)
  label?: string;           // 버튼 라벨
  className?: string;

  mode?: Mode;              // "in"=QR 중앙 로고, "below"=하단 프레임
  lightColor?: string;      // QR 배경색
  darkColor?: string;       // QR 모듈색
  margin?: number;          // quiet zone
};

export default function QRDownloadButtonBB({
  url,
  filename = "qr_blackbill",
  size = 96,
  label = "QR 다운로드",
  className = "",
  mode = "in",
  lightColor = "#ffffff",
  darkColor = "#000000",
  margin = 2,
}: Props) {
  const canMake = useMemo(() => Boolean(url && url.startsWith("http")), [url]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!canvasRef.current || !canMake) return;

      const frameH = mode === "below" ? 36 : 0; // 하단 프레임 높이
      const W = size;
      const H = size + frameH;

      const canvas = canvasRef.current;
      canvas.width = W;
      canvas.height = H;

      const ctx = canvas.getContext("2d")!;
      // 전체 배경
      ctx.fillStyle = lightColor;
      ctx.fillRect(0, 0, W, H);

      // 내부 QR만 그릴 임시 캔버스
      const qrCanvas = document.createElement("canvas");
      qrCanvas.width = size;
      qrCanvas.height = size;

      // ✅ QR을 원하는 색으로 직접 렌더(패턴 손상 X)
      await QRCode.toCanvas(qrCanvas, url, {
        width: size,
        margin,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: "H",
      });

      // QR 붙이기
      ctx.drawImage(qrCanvas, 0, 0);

      // 로고/프레임 합성
      const logo = await loadImage(blackBillLogo);

      if (mode === "in") {
        // ◯ 중앙 로고(흰 원판 + 로고)
        const ratio = 0.22;                 // QR 대비 로고 변 비율
        const side = Math.round(size * ratio);
        const pad = Math.round(side * 0.18);
        const board = side + pad * 2;
        const x = (size - board) / 2;
        const y = (size - board) / 2;

        // 흰 원판
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + board / 2, y + board / 2, board / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // 로고(살짝 라운드 사각형 느낌)
        const lx = x + pad;
        const ly = y + pad;
        roundRect(ctx, lx, ly, side, side, Math.min(10, side / 4));
        ctx.clip();
        ctx.drawImage(logo, lx, ly, side, side);
        ctx.restore();
      } else {
        // ▭ 하단 프레임(바 + 로고 + 텍스트)
        const barH = frameH;
        const barY = size;

        // 바 배경
        ctx.fillStyle = "#f8fafc"; // 연한 회색
        ctx.fillRect(0, barY, size, barH);

        // 로고
        const side = 20;
        const padX = 10;
        const padY = Math.round((barH - side) / 2);
        ctx.save();
        roundRect(ctx, padX, barY + padY, side, side, 6);
        ctx.clip();
        ctx.drawImage(logo, padX, barY + padY, side, side);
        ctx.restore();

        // 라벨 텍스트
        ctx.fillStyle = "#111827"; // gray-900
        ctx.font = `600 13px ui-sans-serif, system-ui, -apple-system`;
        ctx.textBaseline = "middle";
        ctx.fillText("BlackBill · 가사집", padX + side + 8, barY + barH / 2);
      }
    })();
  }, [url, size, canMake, lightColor, darkColor, margin, mode]);

  const handleDownload = () => {
    if (!canvasRef.current || !canMake) return;
    const a = document.createElement("a");
    a.download = `${filename}${mode === "below" ? "_frame" : "_in"}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="border rounded-lg overflow-hidden bg-white"
        style={{ width: size, height: size + (mode === "below" ? 36 : 0) }}
        aria-label="QR 미리보기"
      >
        <canvas ref={canvasRef} width={size} height={size + (mode === "below" ? 36 : 0)} />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!canMake}
        className={`px-3 py-2 rounded-full text-sm ${
          canMake ? "bg-black text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        title={canMake ? url : "유효한 URL이 없습니다"}
      >
        {label}
      </button>
    </div>
  );
}

/** utils */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r = 12
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
