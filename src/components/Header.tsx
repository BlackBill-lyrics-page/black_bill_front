import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center p-4">
      {/* 왼쪽 로고 */}
      <span
        className="text-xl font-bold cursor-pointer"
        onClick={() => navigate("/home")}
      >
        LOGO
      </span>

      {/* 오른쪽 버튼들 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/search")}
          className="p-2 rounded hover:bg-gray-100"
        >
          <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() => navigate("/my_audience")}
          className="p-2 rounded hover:bg-gray-100"
        >
          <UserIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
