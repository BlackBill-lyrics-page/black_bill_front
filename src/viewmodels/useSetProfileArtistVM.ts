import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { uploadArtistPhoto } from '../utility/uploadArtistPhoto';


export const useSetProfileArtistVM = () => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [label, setLabel] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [instruments, setInstruments] = useState('');
  const [snsLinks, setSnsLinks] = useState([{ platform: 'instagram', url: '' }]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl); //cleanup function(executed right before changing photoFile) memory leak prevention. 
  }, [photoFile]);


  const handleSubmit = async () => {
    const user = (await supabase.auth.getUser()).data.user; // const {data. error} = await supabase.auth.getUser(); 
    if (!user) return alert('로그인이 필요합니다.');

    if (!photoFile) return alert('프로필 사진을 등록해주세요.');

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


    const linksToInsert = snsLinks.map((link) => ({ //making tables
      artist_id: artist.id,
      platform: link.platform,
      url: link.url,
      icon_url: null, // 아이콘이미지 추후 구현
    }));

    const { error: linksError } = await supabase.from('artist_links').insert(linksToInsert); //inserting tables into DB
    if (linksError) {
      console.error(linksError);
      return;
    }

    alert('Setting artist profile complete!');
  };

  return {
    photoUrl, setPhotoUrl,
    name, setName,
    bio, setBio,
    label, setLabel,
    selectedGenres, setSelectedGenres,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    photoFile, setPhotoFile,
    handleSubmit,
  };
};
