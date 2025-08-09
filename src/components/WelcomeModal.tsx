import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom' //dismiss the physical location while maintaining relation
import { useNavigate } from 'react-router-dom'

const WelcomeModal = ({ username, onClose }: { username: string, onClose: () => void }) => {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { //wait until browers is ready
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" /> {/*blur the background, absolute->fixed */}

      <div className="relative z-10 bg-white p-8 rounded-xl text-center max-w-sm w-full shadow-lg">
        <div className="w-16 h-16 bg-gray-200 mx-auto mb-4 flex items-center justify-center rounded">logo</div>
        <p className="font-semibold text-lg mb-2">반가워요, {username}님</p>
        <p className="text-gray-600 mb-6">BlackBill에 오신 것을 환영합니다!</p>
        <button
          onClick={() => {
            onClose()
            navigate('/')
          }}
          className="w-full bg-gray-100 text-sm py-2 rounded hover:bg-gray-200 transition"
        >
          시작하기
        </button>
      </div>
    </div>,
    document.body
  )
}

export default WelcomeModal
