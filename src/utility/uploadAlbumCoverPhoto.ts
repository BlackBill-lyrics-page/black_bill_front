// 가사집 추가 시 가사집 이미지 업로드 하는 함수
import { supabase } from '../lib/supabaseClient';

export async function uploadAlbumCoverPhoto(
    file: File,
    userId: string,
    albumName: string
){
    const fileExt = file.name.split('.').pop();
    const safeAlbumName = albumName.replace(/[^\w\-]/g, '_');
    // 경로 : album-images - uuid - 앨범 제목
    const objectName = `${userId}/${safeAlbumName}/${Date.now()}.${fileExt}`;
    const { data: _, error } = await supabase.storage
        .from('album-images')
        .upload(objectName, file);

    if (error) {
        console.error("앨범 커버 사진 업로드 실패:", error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('album-images')
        .getPublicUrl(objectName);
    return publicUrl;
}
