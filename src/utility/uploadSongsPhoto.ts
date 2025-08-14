// 곡 추가 시 곡 이미지 업로드 하는 함수
import { supabase } from '../lib/supabaseClient';

export async function uploadArtistSongsPhoto(
    file: File,
    userId: string,
    songTitle: string // 곡 제목을 디렉토리 이름으로(uuid - songs - 내부에 곡 제목으로 된 디렉토리 생성)
) {
    const fileExt = file.name.split('.').pop();
    const safeSongTitle = songTitle.replace(/[^\w\-]/g, '_'); // 곡 제목 안전 처리
    // 경로 : song-images - uuid - 곡 제목
    const objectName = `${userId}/${safeSongTitle}/${Date.now()}.${fileExt}`;
    const { data: _, error } = await supabase.storage
        .from('song-images')
        .upload(objectName, file, { cacheControl: '3600', upsert: false });
    if (error) {
        console.error('Upload failed:', error);
        return null;
    }
    const { data: { publicUrl } } = supabase.storage
        .from('song-images')
        .getPublicUrl(objectName);
    return publicUrl;
}