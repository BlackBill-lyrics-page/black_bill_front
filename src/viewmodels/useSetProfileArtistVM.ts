// src/viewmodels/useSetProfileArtistVM.ts
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSetProfileArtistVM = () => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [label, setLabel] = useState('');
  const [genre, setGenre] = useState('');
  const [instruments, setInstruments] = useState('');
  const [snsLinks, setSnsLinks] = useState([{ platform: 'instagram', url: '' }]);

  const handleSubmit = async () => {
    const user = (await supabase.auth.getUser()).data.user; // const {data. error} = await supabase.auth.getUser(); 
    if (!user) return alert('login required');

    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .insert({  
        user_id: user.id,
        photo_url: photoUrl,
        name,
        bio,
        label,
        genre,
        instruments
      })
      .select()  //return the inserted row to data (: artist) 
      .single(); //not in array but single object

    if (artistError) {
      console.error(artistError);
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
    genre, setGenre,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    handleSubmit,
  };
};
