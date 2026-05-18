import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown, FiEye, FiMic } from "react-icons/fi";

type Props = {
  align?: "left" | "right";  // 우측 정렬 기본
  label?:string
};

export default function RoleSwitcher({ align = "right", label = "role" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside); //freeing
  }, []);

  const go = (path: string) => {
    navigate(`${path}?from=${encodeURIComponent(location.pathname + location.search)}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50"
        title="관객 모드와 아티스트 모드를 전환합니다"
      >
        {label === "아티스트" ? <FiMic className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        <span className="font-medium">{label} 모드</span>
        <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg z-20 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">보기 모드 전환</div>
            <div className="mt-0.5 text-xs text-gray-500">같은 계정의 역할은 유지됩니다.</div>
          </div>
          <button
            className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
            onClick={() => go("/my_audience")}
          >
            <FiEye className="mt-0.5 h-4 w-4 text-gray-500" />
            <span>
              <span className="block font-medium text-gray-900">관객으로 보기</span>
              <span className="block text-xs text-gray-500">좋아요, 팔로우, 감상 활동</span>
            </span>
          </button>
          <button
            className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
            onClick={() => go("/my_artist")}
          >
            <FiMic className="mt-0.5 h-4 w-4 text-gray-500" />
            <span>
              <span className="block font-medium text-gray-900">아티스트 스튜디오</span>
              <span className="block text-xs text-gray-500">곡, 가사집, 공연 관리</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
