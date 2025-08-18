import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
      >
        {label} <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-32 bg-white border rounded-md shadow z-20 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => go("/my_audience")}
          >
            관객
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => go("/my_artist")}
          >
            아티스트
          </button>
        </div>
      )}
    </div>
  );
}
