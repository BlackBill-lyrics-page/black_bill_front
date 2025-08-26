import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadArtistPhoto } from '../utility/uploadArtistPhoto';


export const useSetProfileArtistVM = () => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [label, setLabel] = useState('');
  const [instruments, setInstruments] = useState('');
  const [snsLinks, setSnsLinks] = useState([{ platform: 'instagram', url: '' }]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const applyCroppedPhoto = (file: File, previewUrl: string) => {
    setPhotoFile(file);
    setPhotoUrl(previewUrl);
  };


  useEffect(() => {
    if (!photoFile) {
      setPhotoUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl); //cleanup function(executed right before changing photoFile) memory leak prevention. 
  }, [photoFile]);


  const handleSubmit = async (selectedGenres: number[]) => {
    const user = (await supabase.auth.getUser()).data.user; // const {data. error} = await supabase.auth.getUser(); 
    if (!user) return alert('로그인이 필요합니다.');

    if (!photoFile) return alert('프로필 사진을 등록해주세요.');

    if (label.length>30) return alert ('소속사는 30자를 초과할 수 없습니다.')

    if (bio.length>500) return alert ('아티스트 설명은 500자를 초과할 수 없습니다.')

    if (instruments.length>30) return alert ('구성은 30자를 초과할 수 없습니다.')

    if (!name.trim()) return alert('활동명을 입력해주세요.');

    if (selectedGenres.length < 1) {
      return alert('장르는 최소 1개 이상 선택해야 합니다.');
    }
    if (selectedGenres.length > 3) {
      return alert('장르는 최대 3개까지만 선택 가능합니다.');
    }


    const uploadedUrl = await uploadArtistPhoto(photoFile, user.id);
    if (!uploadedUrl) return alert('Uploading failed');

    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .insert({  
        user_id: user.id,
        photo_url: uploadedUrl,
        name,
        bio,
        label,
        instruments
      })
      .select()  //return the inserted row to data (: artist) 
      .single(); //not in array but single object

    if (artistError) {
      console.error(artistError);
      return;
    }

    const genreRows = selectedGenres.map((genre_id) => ({  // inserting genre logic      {artist_id : 23, genre_id : 2}
      artist_id: artist.id,
      genre_id
    }));

    const { error: genreInsertError } = await supabase
      .from('artist_genres')
      .insert(genreRows);

    if (genreInsertError) {
      console.error(genreInsertError);
      return;
    }


    const linksToInsert = snsLinks
      .filter((link)=>link.url.trim()!=='') // "" URL avoidance
      .map((link) => ({ 
        artist_id: artist.id,
        platform: link.platform,
        url: link.url,
        icon_url: null, // 아이콘이미지 추후 구현
      }));


    const { data : insertedLinks, error: linksError } = await supabase
      .from('artist_links')
      .insert(linksToInsert)
      .select(); //inserting tables into DB

    if (linksError) {
      console.error(" Insert Error:", linksError.message);
      console.error(" Details:", linksError.details);
      console.error(linksError);
      return;
    }
    
    console.log('Inserted SNS Links:', insertedLinks);
    alert('아티스트 프로필 설정을 완료하였습니다.');
    window.location.replace('/my_artist');
    return;
  };

  return {
    photoUrl, setPhotoUrl,
    name, setName,
    bio, setBio,
    label, setLabel,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    photoFile, setPhotoFile,
    handleSubmit,
    applyCroppedPhoto,
  };
};
