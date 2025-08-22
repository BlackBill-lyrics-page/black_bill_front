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
  const [showTerms, setShowTerms] = useState(false)   // 약관 화면 전환
  const [agreeAll, setAgreeAll] = useState(false)     // 전체 동의 체크

  return (
    <div className="relative w-full">
      <div className="w-full max-w-md mx-auto mt-6 p-6 rounded-2xl shadow-md bg-white transition-all duration-300 h-[620px] overflow-hidden flex flex-col">

        {!showTerms ? (
          <div className="flex flex-col gap-5">

            <div className='mb-25'>
              <img src="/logo.png" alt="logo" className="w-12 h-12" />
              <div className="mt-2 text-xl font-semibold">이메일 회원가입</div>
            </div>

            <div className="flex flex-col gap-2 pt-12">
              <label className="text-sm font-bold">이메일</label>
              <input
                type="email"
                placeholder="이메일 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-100 p-3 rounded-full text-sm placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">비밀번호 입력</label>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => {
                  const value = e.target.value
                  setPassword(value)
                  setPasswordError(!validatePassword(value))
                }}
                className="bg-gray-100 p-3 rounded-full text-sm placeholder-gray-400"
              />
              <p className={`text-xs ${passwordError ? 'text-red-500' : 'text-gray-500'}`}>
                8~20자, 영문/숫자/특수기호 중 2가지 이상 포함
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* 전체약관 동의 (→ 약관 화면으로 전환) */}
            <button
              type="button"
              onClick={() => setShowTerms(true)}   // 카드 전체 전환
              className="w-full flex items-center justify-between bg-white  rounded-xl px-1 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => setAgreeAll(e.target.checked)}
                  className="w-4 h-4"
                  onClick={(e) => e.stopPropagation()}
                />
                전체약관 동의
              </span>

              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <button
              onClick={async () => {
                const success = await handleSignup()
                if (success) setShowWelcomeModal(true)
              }}
              disabled={loading || !agreeAll}
              className="w-full bg-gray-100 text-gray-900 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>

          </div>
        ) : (

          <div className="flex flex-col h-[600px]">
            {/* 헤더: 뒤로 + 제목 */}
            <div className="flex items-center h-10 mb-4">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                aria-label="뒤로"
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <h3 className="text-xl font-semibold">전체약관</h3>
            </div>

            {/* 약관 내용 */}
            <div className="h-[450px] overflow-y-auto text-sm text-gray-700 leading-relaxed pr-1 rounded-xl bg-gray-50 p-4">
              {/* TODO: 실제 약관 텍스트로 교체 */}
              <ol className="list-decimal pl-5 space-y-2">
                <li>회원은 회사가 정하는 절차에 따라 서비스에 접근·이용할 수 있습니다.</li>
                <li>회사는 서비스의 품질 향상 또는 유지보수를 위해 사전 공지 후 서비스를 일부 변경하거나 중단할 수 있습니다.</li>
              </ol>

              <p className="mt-3 font-semibold">제6조 (회원의 의무)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>타인의 권리침해, 불법 행위 금지</li>
                <li>법령·약관 준수</li>
                <li>서비스 안전을 저해하는 콘텐츠 업로드 금지</li>
              </ul>

              <p className="mt-3 font-semibold">제7조 (업로드 콘텐츠에 대한 책임)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>저작권 등 관련 법령 준수 및 분쟁 책임은 업로더에게 있음</li>
              </ul>

              <p className="mt-3 font-semibold">제8조 (회원정보 및 데이터 처리)</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>정확한 정보 유지 의무 및 변경 시 지체 없는 수정</li>
                <li>관련 법령에 따른 보관·삭제 정책 준수</li>
              </ul>
            </div>

            {/* 동의 버튼 */}
            <button
              type="button"
              onClick={() => {
                setAgreeAll(true)     //  체크 상태로
                setShowTerms(false)   //  폼 화면 복귀
              }}
              className="w-full mt-4 bg-gray-100 text-gray-900 py-3 text-sm font-semibold"
            >
              동의합니다
            </button>
          </div>
        )}
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
