import { supabase } from "../lib/supabaseClient";

// (A) Supabase SDK로 버킷/경로 다운로드
export async function downloadFromStorage(bucket: string, path: string, filename?: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;

  const url = URL.createObjectURL(data); 
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? path.split("/").pop() ?? "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// (B) public URL → bucket/path 파싱
export function parseSupabasePublicUrl(url: string) {
  // .../storage/v1/object/public/<bucket>/<path...>
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: m[2] };
}