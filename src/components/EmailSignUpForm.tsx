import { useSignUpVM } from '../viewmodels/useSignUpVM'

const EmailSignUpForm = () => {
    const {
        email, setEmail,
        password, setPassword,
        nickname, setNickname,
        loading, error, handleSignup,
    } = useSignUpVM()

    return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-sm flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center">회원가입</h2>

      <input
        type="email"
        placeholder="이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="password"
        placeholder="비밀번호 입력"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="text"
        placeholder="닉네임/활동명 입력"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="border p-2 rounded"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSignup}
        disabled={loading}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        {loading ? '가입 중...' : '가입하기'}
      </button>
    </div>
  )
}

export default EmailSignUpForm