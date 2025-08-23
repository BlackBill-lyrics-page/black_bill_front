import { useSignUpVM } from '../viewmodels/useSignUpVM'
import { validatePassword } from '../viewmodels/useSignUpVM'
import WelcomeModal from '../components/WelcomeModal'
import { useState } from 'react'
import AuthShell from "../components/login/AuthShell";
import AuthCard from "../components/login/AuthCard";
import AuthHeader from "../components/login/AuthHeader";

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
    <AuthShell>
      <AuthCard>
        {!showTerms && <AuthHeader title="이메일 회원가입"/>}
        <div className="flex-1 px-6">
      

        {!showTerms ? (
          <form 
            onSubmit={async (e)=>{
              e.preventDefault()
              const success = await handleSignup()
              if (success) setShowWelcomeModal(true)
            }}
            className="flex flex-col gap-5">


            <div className="flex flex-col gap-2 pt-40">
              <label className="text-sm font-bold">이메일</label>
              <input
                type="email"
                placeholder="이메일 입력"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-100 p-3 rounded-full text-sm placeholder-gray-400"
              />
            </div>

            <div className="flex flex-col gap-2 pt-3">
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
              type="submit"
              disabled={loading || !agreeAll}
              className="w-full bg-gray-100 text-gray-900 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>

          </form>
        ) : (

          <div className="flex flex-col h-[600px] mt-5">
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
            <div className="h-[450px] overflow-y-auto text-sm text-gray-700 leading-relaxed pr-1 rounded-xl bg-gray-50 p-4 whitespace-pre-line">
              {`제 1 조 (목적) 본 약관은 BlackBill(이하 "회사")이 제공하는 웹·모바일 기반 가사집 서비스(이하 "서비스")의 이용과 관련하여, 회사와 회원 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              
              제 2 조 (용어의 정의)
              회원: 본 약관에 동의하고 서비스에 가입한 자
              아티스트 회원: 서비스에 곡, 가사집, 공연 정보를 업로드하거나 판매하는 회원
              관객 회원: 서비스를 통해 가사집을 열람하거나 구매하는 회원
              콘텐츠: 회원이 서비스에 업로드하거나 게시한 모든 데이터(텍스트, 이미지, 음원, 영상 등)
              계정: 회원이 서비스 이용을 위해 생성한 식별 단위
              저작권자: 콘텐츠에 대한 저작권 또는 그 외 지식재산권을 보유한 개인 또는 단체
              
              제 3 조 (약관의 효력 및 변경)
              본 약관은 회원가입 시 동의 절차를 거쳐 효력이 발생합니다.
              회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 개정 내용과 시행일을 서비스에 게시합니다.
              회원은 개정 약관에 동의하지 않을 경우, 시행일 이전에 회원 탈퇴를 요청할 수 있습니다.
              
              제 4 조 (회원가입)
              회원가입은 약관 동의, 개인정보 처리방침 동의, 필수 정보 입력 후 회사의 승인을 통해 성립됩니다.
              회원은 본인의 정확한 정보를 제공해야 하며, 타인의 명의를 도용할 수 없습니다.
              
              제 5 조 (서비스의 이용)
              회원은 회사가 제공하는 기능과 절차에 따라 서비스에 접근·이용할 수 있습니다.
              회사는 서비스의 품질 향상 또는 유지보수를 위해 사전 공지 후 서비스의 일부를 변경하거나 중단할 수 있습니다.
              
              제 6 조 (회원의 의무)
              회원은 다음 행위를 해서는 안 됩니다.
              타인의 권리(저작권, 초상권 등)를 침해하는 행위
              법령 위반, 범죄와 관련된 행위
              음란물·폭력물 등 사회질서에 반하는 콘텐츠 업로드
              회원은 서비스 이용 시 모든 법률을 준수해야 하며, 이를 위반할 경우 발생하는 모든 법적 책임은 회원 본인에게 있습니다.
              
              제 7 조 (아티스트 업로드 콘텐츠에 대한 책임)
              아티스트 회원은 본인이 업로드하는 곡, 가사, 커버 이미지, 설명, 가사집 제목 및 설명 등 모든 콘텐츠에 대한 저작권 및 사용 권한을 보유하고 있어야 합니다.
              회사는 아티스트 회원이 업로드한 콘텐츠의 저작권, 초상권, 기타 권리에 대해 어떠한 책임도 지지 않습니다.
              제3자가 아티스트 회원의 업로드 콘텐츠에 대해 저작권 침해, 초상권 침해 등의 법적 문제를 제기하는 경우, 해당 문제 해결에 대한 모든 책임은 아티스트 회원에게 있습니다.
              회원은 저작권법 및 관련 법률을 준수해야 하며, 이를 위반하여 발생하는 모든 민·형사상 책임은 회원 본인에게 있습니다.
              
              제 8 조 (회원탈퇴 및 데이터 처리)
              회원이 탈퇴를 요청하면, 회사는 관련 법령이 정한 기간을 제외한 개인정보를 지체 없이 삭제합니다.
              아티스트 회원이 탈퇴하는 경우, 해당 계정의 프로필, 연락처 등 식별 가능한 정보는 즉시 삭제되며, 콘텐츠(곡, 가사집, 공연 기록 등)는 약관에서 동의한 범위 내에서 비공개 또는 작성자를 ‘탈퇴한 아티스트’로 표기하여 보관할 수 있습니다.
              결제·정산 관련 기록은 전자상거래법 및 세법에 따라 5~7년간 보관됩니다.
              회원이 업로드한 콘텐츠의 삭제·보관 여부는 서비스 정책과 관련 법률에 따릅니다.
              
              제 9 조 (저작권)
              회원이 서비스에 업로드한 콘텐츠의 저작권은 원칙적으로 해당 회원에게 귀속됩니다.
              회원은 서비스 운영, 홍보, 개선을 위해 회사가 해당 콘텐츠를 무상·비독점적으로 사용·저장·전송·전시할 수 있는 권리를 부여합니다.
              회사는 회원의 사전 동의 없이 상업적 목적의 2차 저작물을 제작하지 않습니다.
              
              제 10 조 (면책조항)
              회사는 회원이 업로드한 콘텐츠에 대해 사전 심사·검열 의무를 지지 않습니다.
              회사는 회원이 서비스를 통해 얻게 된 정보나 자료의 정확성, 신뢰성에 대해 보증하지 않습니다.
              회사는 천재지변, 시스템 장애, 해킹, 통신 두절 등 불가항력으로 인한 손해에 대해서 책임을 지지 않습니다.
              
              제 11 조 (분쟁 해결)
              본 약관과 관련하여 발생한 분쟁은 회사의 본사 소재지를 관할하는 법원에서 해결합니다.
              회사와 회원은 분쟁 발생 시 원만한 해결을 위해 성실히 협의합니다.
              
              부칙
              본 약관은 2025년 08월 24일부터 시행합니다.
              본 약관 시행 이전 가입한 회원도 본 약관의 적용을 받습니다.`}
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

      </AuthCard>
    </AuthShell>
  )
}

export default EmailSignUpForm
