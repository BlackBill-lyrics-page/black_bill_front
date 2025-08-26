// [NEW] 가사집이 열린 상태의 '관객용 ArtistPage' 딥링크를 생성
export function buildArtistAlbumPublicUrl(params: {
  origin?: string;            // 테스트/프리뷰용. 보통 window.location.origin 사용
  artistId: number | string;
  albumId?: number | string;  // 없으면 가사집 탭만 열림
  utm?: Record<string, string>;
}) {
  const { origin, artistId, albumId, utm } = params;

  const base = (origin ?? (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  const url = new URL(`${base}/artist/${artistId}`);

  // 관객용 페이지에서 가사집 탭 오픈 + 특정 가사집 자동 오픈
  url.searchParams.set("tab", "books");
  if (albumId != null) url.searchParams.set("album", String(albumId));

  // (옵션) UTM/추적 파라미터
  if (utm) {
    Object.entries(utm).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
