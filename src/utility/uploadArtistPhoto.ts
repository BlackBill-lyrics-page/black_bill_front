import { supabase } from '../lib/supabaseClient';

export async function uploadArtistPhoto(file: File, userId: string) { //userId : uuid -> string취급
  const fileExt = file.name.split('.').pop(); // photo.jpg -> ["photo", "jpg"] -> pop() -> fileExt="jpg"
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  const { data: _, error } = await supabase.storage //data is not used for now.
    .from('artist-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false  //duplicated photo not allowed
    });

  if (error) {
    console.error('Upload failed:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('artist-photos').getPublicUrl(filePath);  //profile photo - public (추후 변경?)

  return publicUrl;
}
