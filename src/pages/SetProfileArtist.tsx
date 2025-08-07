import { useSetProfileArtistVM } from '../viewmodels/useSetProfileArtistVM';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'

const SetProfileArtist = () => {
  const {
    photoUrl, setPhotoUrl,
    name, setName,
    bio, setBio,
    label, setLabel,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    photoFile, setPhotoFile,
    selectedGenres, setSelectedGenres,
    handleSubmit
  } = useSetProfileArtistVM();

  const [genreList, setGenreList] = useState<{ id: number; name: string }[]>([]);
  const [genreError, setGenreError] =useState('');

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase.from('genres').select('id, name');
      if (error) {
        console.error('genre loading failed:', error);
        return;
      }
      setGenreList(data || []); //data or empty array
    };

    fetchGenres();
  }, []);


  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">아티스트 프로필 설정</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          아티스트 프로필 사진 <span className="text-red-500">필수</span>
        </label>

        <div className="relative w-32 h-32 mx-auto">
          <img
            src={photoUrl || '/default-user-icon.png'} // default image or preview 
            alt="preview"
            className="w-full h-full rounded-full object-cover border border-gray-300"
          />

          <label
            htmlFor="photo-upload" // id="photo-upload" 
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 cursor-pointer hover:bg-gray-100"
          >
            <span className="text-xl leading-none">＋</span>
          </label>

          <input
            id="photo-upload" // htmlFor="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]; // ? (multiple chaining) if files==null return undefined without error
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
      const isSelected = selectedGenres.includes(genre.id);
      return (
        <button
          key={genre.id}
          type="button"
          className={`px-3 py-1 rounded-full border text-sm ${
            isSelected
              ? 'bg-blue-600 text-white border-blue-600' //isSelected==true
              : 'bg-white text-gray-700 border-gray-300' //isSelected==false
          }`}
          onClick={() => {
            if (isSelected) {
              if(selectedGenres.length===1){
                setGenreError('장르는 최소 1개 이상 선택해야 합니다.');
                return;
              }
              setGenreError('');

              setSelectedGenres(selectedGenres.filter((id) => id !== genre.id)); //filter : creating new array without selected id
            } else {
              if (selectedGenres.length>=3){
                setGenreError('장르는 최대 3개까지만 선택 가능합니다.');
                return;
              }
              setGenreError('');
              setSelectedGenres([...selectedGenres, genre.id]); //spread operator
            }
          }}
        >
          {genre.name}
        </button>
      );
    })}
  </div>

  {selectedGenres.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {selectedGenres.map((id) => {
        const genre = genreList.find((g) => g.id === id);
        return (
          <span
            key={id}
            className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {genre?.name}
            <button
              className="ml-2 text-blue-500 hover:text-blue-700"
              onClick={() =>
                setSelectedGenres(selectedGenres.filter((genreId) => genreId !== id))
              }
            >
              ×
            </button>
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
        <div key={idx}>

          <select
            value={link.platform}
            onChange={(e) => {
              const updated = [...snsLinks];
              updated[idx].platform = e.target.value;
              setSnsLinks(updated);
            }}
          >
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="soundcloud">Soundcloud</option>
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
        </div>
      ))}

      <button onClick={() => setSnsLinks([...snsLinks, { platform: 'instagram', url: '' }])}>   
        SNS 링크 추가
      </button> 

      <button onClick={handleSubmit}>가입하기</button>
    </div>
  );
};

export default SetProfileArtist;
