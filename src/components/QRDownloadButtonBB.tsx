import { useMemo } from "react";
import QRCodeStyling from "qr-code-styling";

type Props = {
  url: string;
  filename?: string;
  size?: number;           // 결과 정사각형(px)
  label?: string;
  className?: string;

  // 색/스타일
  background?: string;     // 배경색
  foreground?: string;     // 점(모듈) 단색
  dotType?: "dots" | "rounded" | "classy" | "classy-rounded" | "square" | "extra-rounded";
  eyeType?: "dot" | "rounded" | "square" | "extra-rounded";
  gradient?: {
    type?: "linear" | "radial";
    rotation?: number;     // 0~1 (linear일 때)
    colors: { offset: number; color: string }[];
  } | null;

  // 중앙 로고
  centerImageSrc?: string; // PNG/SVG 경로
  logoSizeRatio?: number;  // QR 한 변 대비 로고 비율(0.12~0.28 권장)
  logoPadding?: number;    // 로고 주변 투명 패딩(px)

  // QR 내부 마진/에러보정
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

export default function QRDownloadButtonBB({
  url,
  filename = "qr_blackbill",
  size = 768,
  label = "QR 다운로드",
  className = "",

  background = "#ffffff",
  foreground = "#000000",
  dotType = "dots",
  eyeType = "rounded",
  gradient = null,

  centerImageSrc,
  logoSizeRatio = 0.20,
  logoPadding = 8,

  errorCorrectionLevel = "H",
}: Props) {
  const canMake = useMemo(() => /^https?:\/\//.test(url), [url]);

  const handleDownload = async () => {
    if (!canMake) return;

    const options: any = {
      width: size,
      height: size,
      type: "png",
      data: url,
      backgroundOptions: { color: background },
      qrOptions: { errorCorrectionLevel }, // 로고 넣을 때 H 권장
      // 점(모듈)
      dotsOptions: gradient
        ? { type: dotType, gradient }
        : { type: dotType, color: foreground },
      // 코너(eye)
      cornersSquareOptions: { type: eyeType, color: foreground },
      cornersDotOptions: { type: "dot", color: foreground },
      // 중앙 로고
      image: centerImageSrc ?? undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        hideBackgroundDots: true,          // 로고 아래 점 제거
        margin: logoPadding,               // 로고 주변 투명 패딩
        imageSize: Math.max(0.12, Math.min(logoSizeRatio, 0.28)), // 안전 범위
      },
    };

    const qr = new QRCodeStyling(options);
    // const blob: Blob = await qr.getRawData("png");  ❌ 이 부분 대신
    const data = await qr.getRawData("png");
    if (!data) return; // null일 경우 그냥 종료

    const blob = data as Blob; // png일 때는 Blob만 오니까 단언
    const ab = document.createElement("a");
    ab.download = `${filename}_fancy.png`;
    ab.href = URL.createObjectURL(blob);
    ab.click();
    URL.revokeObjectURL(ab.href);
    URL.revokeObjectURL(ab.href);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!canMake}
      className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${canMake ? "bg-black text-white hover:opacity-90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
        } ${className}`}
      title={canMake ? url : "유효한 URL이 없습니다"}
    >
      <span className="text-white">{label}</span>
      {/* 다운로드 아이콘 */}
      <svg width="20" height="20" viewBox="0 0 25 24" fill="none" aria-hidden>
        <path d="M21.5 15V19C21.5 19.5304 21.2893 20.0391 20.9142 20.4142C20.5391 20.7893 20.0304 21 19.5 21H5.5C4.96957 21 4.46086 20.7893 4.08579 20.4142C3.71071 20.0391 3.5 19.5304 3.5 19V15"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 10L12.5 15L17.5 10"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12.5 15V3"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
