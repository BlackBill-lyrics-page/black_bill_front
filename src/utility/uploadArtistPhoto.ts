// import { supabase } from '../lib/supabaseClient';

// export async function uploadArtistPhoto(file: File, userId: string) { //userId : uuid -> string취급
//   const fileExt = file.name.split('.').pop(); // photo.jpg -> ["photo", "jpg"] -> pop() -> fileExt="jpg"
//   const filePath = `${userId}/${Date.now()}.${fileExt}`;


//   const { data: _, error } = await supabase.storage //data is not used for now.
//     .from('artist-photos')
//     .upload(filePath, file, {
//       cacheControl: '3600',
//       upsert: false  //duplicated photo not allowed
//     });

//   if (error) {
//     console.error('Upload failed:', error);
//     return null;
//   }

//   const {
//     data: { publicUrl },
//   } = supabase.storage.from('artist-photos').getPublicUrl(filePath);  //profile photo - public (추후 변경?)

//   return publicUrl;
// }
import { supabase } from '../lib/supabaseClient';

export async function uploadArtistPhoto(file: File, userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const authUid = session?.user?.id ?? null;

  const fileExt = file.name.split('.').pop() || 'bin';
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  // console.group('[uploadArtistPhoto] debug');
  // console.log('hasSession:', !!session);
  // console.log('authUid:', authUid);
  // console.log('param userId:', userId);
  // console.log('file.name:', file.name);
  // console.log('fileExt:', fileExt);
  // console.log('bucket:', 'artist-photos');
  // console.log('filePath:', filePath);
  // console.log('pathStartsWithAuthUid:', authUid ? filePath.startsWith(`${authUid}/`) : false);
  // console.groupEnd();


  const { data, error } = await supabase
    .storage
    .from('artist-photos')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    // Supabase SDK 에러를 JSON으로 까서 보는 게 도움이 됨
    console.error('Upload failed (raw):', error);
    try { console.error('Upload failed (JSON):', JSON.stringify(error, null, 2)); } catch {}
    return null;
  }
  

  const { data: { publicUrl } } =
    supabase.storage.from('artist-photos').getPublicUrl(filePath);

  return publicUrl;
}

export async function debugWhoAmI() {
  const { data, error } = await supabase.rpc('whoami');
  console.log('whoami:', data, error);
}
(window as any).debugWhoAmI = debugWhoAmI;