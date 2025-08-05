import { useSetProfileArtistVM } from '../viewmodels/useSetProfileArtistVM';

const SetProfileArtist = () => {
  const {
    photoUrl, setPhotoUrl,
    name, setName,
    bio, setBio,
    label, setLabel,
    genre, setGenre,
    instruments, setInstruments,
    snsLinks, setSnsLinks,
    handleSubmit
  } = useSetProfileArtistVM();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">아티스트 프로필 설정</h1>

      <input placeholder="활동명" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea placeholder="아티스트 설명" value={bio} onChange={(e) => setBio(e.target.value)} />
      <input placeholder="소속사" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input placeholder="장르 입력" value={genre} onChange={(e) => setGenre(e.target.value)} />
      <input placeholder="밴드 구성" value={instruments} onChange={(e) => setInstruments(e.target.value)} />

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
