import { useEffect, useState } from "react";
import { FiBookOpen, FiMusic, FiUser } from "react-icons/fi";

type Kind = "artist" | "album" | "song" | "stage";

type Props = {
  src?: string | null;
  alt: string;
  kind: Kind;
  title?: string | null;
  subtitle?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export default function ContentImage({
  src,
  alt,
  kind,
  title,
  subtitle,
  className = "",
  fallbackClassName = "",
}: Props) {
  const [failed, setFailed] = useState(false);
  const cleanSrc = src?.trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanSrc]);

  if (cleanSrc && !failed) {
    return (
      <img
        src={cleanSrc}
        alt={alt}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Fallback
      kind={kind}
      title={title}
      subtitle={subtitle}
      className={`${className} ${fallbackClassName}`}
    />
  );
}

function Fallback({
  kind,
  title,
  subtitle,
  className,
}: {
  kind: Kind;
  title?: string | null;
  subtitle?: string | null;
  className?: string;
}) {
  const initial = (title?.trim()?.[0] || "B").toUpperCase();

  if (kind === "artist") {
    return (
      <div className={`bg-gray-100 text-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-xl font-semibold">{initial}</span>
      </div>
    );
  }

  const Icon = kind === "song" ? FiMusic : kind === "album" ? FiBookOpen : FiUser;
  return (
    <div className={`relative overflow-hidden bg-gray-100 text-gray-700 flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f3f4f6_0%,#ffffff_55%,#e5e7eb_100%)]" />
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
        <Icon className="h-5 w-5 text-gray-400" />
        {kind === "album" && title ? (
          <>
            <div className="line-clamp-2 text-[11px] font-semibold leading-tight text-gray-800">
              {title}
            </div>
            {subtitle && <div className="truncate text-[10px] text-gray-500">{subtitle}</div>}
          </>
        ) : (
          <span className="text-xs text-gray-400">No image</span>
        )}
      </div>
    </div>
  );
}
