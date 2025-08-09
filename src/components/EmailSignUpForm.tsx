import { useSignUpVM } from '../viewmodels/useSignUpVM'
import { validatePassword } from '../viewmodels/useSignUpVM'
import WelcomeModal from '../components/WelcomeModal'
import { useState } from 'react'

const EmailSignUpForm = () => {
  const {
    email, setEmail,
    password, setPassword,
    loading, error, handleSignup,
    passwordError, setPasswordError,
  } = useSignUpVM()

  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  return (
    <div className="relative">
      <div className={`max-w-md mx-auto mt-12 p-6 border rounded-lg shadow-sm flex flex-col gap-4 transition-all duration-300`}>
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
          onChange={(e) => {
            const value = e.target.value
            setPassword(value)
            setPasswordError(!validatePassword(value))
          }}
          className="border p-2 rounded"
        />

        <p
          className={`text-sm ${passwordError ? 'text-red-500' : 'text-gray-500'}`}
        >
          {'8~20자, 영문/숫자/특수기호 중 2가지 이상 포함'}
        </p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={async () => {
            const success = await handleSignup()
            if (success) setShowWelcomeModal(true)
          }}
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </div>

      {showWelcomeModal && (
        <WelcomeModal
          username={email.split('@')[0]}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </div>
  )
}

export default EmailSignUpForm
