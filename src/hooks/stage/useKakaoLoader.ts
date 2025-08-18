// hooks/useKakaoLoader.ts
import { useEffect, useState } from "react";

declare global {
  interface Window { kakao?: any; }
}

/**
 * Kakao Maps JS SDK 로더
 * - 이미 로딩되어 있으면 즉시 ready=true
 * - 아니면 스크립트를 동적 주입 (자동로드 끄고, load 콜백에서 ready=true)
 */
export function useKakaoLoader(appKey: string) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 이미 준비됨
    if (window.kakao?.maps?.services) {
      setReady(true);
      return;
    }

    // 이미 같은 스크립트가 붙어있는지 검사
    const existed = document.querySelector<HTMLScriptElement>('script[data-kakao="maps"]');
    if (existed) {
      existed.addEventListener("load", () => {
        if (window.kakao?.maps) window.kakao.maps.load(() => setReady(true));
      });
      return;
    }

    // 동적 로딩
    const s = document.createElement("script");
    s.dataset.kakao = "maps";
    s.async = true;
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    s.onload = () => {
      if (window.kakao?.maps) window.kakao.maps.load(() => setReady(true));
    };
    document.head.appendChild(s);
  }, [appKey]);

  return ready;
}
