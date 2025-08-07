import { useSetProfileArtistVM } from '../viewmodels/useSetProfileArtistVM';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'
import { useMemo } from 'react';
import clsx from 'clsx';
import styles from './SetProfileArtist.module.css';

const SetProfileArtist = () => {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const {
    photoUrl, setPhotoUrl,
    name, setName,
    bio, setBio,
    label, setLabel,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    photoFile, setPhotoFile,
    handleSubmit
  } = useSetProfileArtistVM();

  const [genreList, setGenreList] = useState<{ id: number; name: string }[]>([]); // fetch는 VM에서 X
  const [genreError, setGenreError] = useState('');

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase.from('genres').select('id, name');
      if (error) {
        console.error('genre loading failed:', error);
        return;
      }
      setGenreList(data || []);
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    
  }, [selectedGenres]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">아티스트 프로필 설정</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          아티스트 프로필 사진 <span className="text-red-500">필수</span>
        </label>

        <div className="relative w-32 h-32 mx-auto">
          <img
            src={photoUrl || '/default-user-icon.png'}
            alt="preview"
            className="w-full h-full rounded-full object-cover border border-gray-300"
          />

          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 cursor-pointer hover:bg-gray-100"
          >
            <span className="text-xl leading-none">＋</span>
          </label>

          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhotoFile(file);
            }}
          />
        </div>
      </div>

      <input placeholder="활동명" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea placeholder="아티스트 설명" value={bio} onChange={(e) => setBio(e.target.value)} />
      <input placeholder="소속사" value={label} onChange={(e) => setLabel(e.target.value)} />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">장르 선택</label>

        <div className="flex flex-wrap gap-2">
          {genreList.map((genre) => {
            const genreId = Number(genre.id);
            const isSelected = selectedGenres.includes(genreId);

            console.log(
              `🎯 Button Render | genreId: ${genreId} | isSelected: ${isSelected} | selectedGenres: [${selectedGenres.join(', ')}]`
            );

            return (
              <button
                key={genre.id}
                type="button"
                
                className={`${styles['genre-button']} ${isSelected ? styles['selected'] : ''}`} //tailwind 안되서 css씀

                onClick={() => {
                  const genreId = Number(genre.id);

                  setSelectedGenres((prev)=>{
                    const isSelected = prev.includes(genreId);

                    if (isSelected) {
                      setGenreError('');
                      return prev.filter((id)=>id!==genreId);       
                    } else {
                      if (prev.length >= 3) {
                        setGenreError('장르는 최대 3개까지만 선택 가능합니다.');
                        return prev;
                      }
                      setGenreError('');
                      return [...prev, genreId];
                    }
                  });    
                }}
              >
                {genre.name}
              </button>
            );
          })}
        </div>

        {selectedGenres.length > 0 && genreList.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedGenres.map((id) => {
              const genre = genreList.find((g) => g.id === id);
              if (!genre) {
                console.warn('[selectedGenres] ID not found in genreList:', id);
                return null;
              }
              return (
                <span
                  key={id}
                  className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              );
            })}
          </div>
        )}

        {genreError && (
          <p className="text-red-500 text-sm mt-2">{genreError}</p>
        )}
      </div>

      <input placeholder="밴드 구성" value={instruments} onChange={(e) => setInstruments(e.target.value)} />

      {photoUrl && (
        <img
          src={photoUrl}
          alt="미리보기"
          className="w-40 h-40 object-cover rounded-full my-4 border"
        />
      )}

      {snsLinks.map((link, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2">
          <select
            value={link.platform}
            onChange={(e) => {
              const updated = [...snsLinks];
              updated[idx].platform = e.target.value;
              setSnsLinks(updated);
            }}
          >
            <option value="instagram">instagram</option>
            <option value="youtube">YouTube</option>
            <option value="soundcloud">Soundcloud</option>
            <option value="bandcamp">Bandcamp</option>
            <option value="tiktok">TikTok</option>
            <option value="x">X</option>
            <option value="spotify">Spotify</option>
            <option value="melon">Melon</option>
          </select>

          <input
            placeholder="링크 입력"
            value={link.url}
            onChange={(e) => {
              const updated = [...snsLinks];
              updated[idx].url = e.target.value;
              setSnsLinks(updated);
            }}
          />

          <button
            type="button"
            onClick={() => {
              const updated = snsLinks.filter((_, i) => i !== idx);
              setSnsLinks(updated);
            }}
            className="text-red-500 hover:text-red-700"
            title="삭제"
          >
            🗑️
          </button>
        </div>
      ))}

      <button onClick={() => setSnsLinks([...snsLinks, { platform: 'instagram', url: '' }])}>
        SNS 링크 추가
      </button>

      <button onClick={()=>handleSubmit(selectedGenres)}>가입하기</button>
    </div>
  );
};

export default SetProfileArtist;
