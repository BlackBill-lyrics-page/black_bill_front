import { useNavigate } from "react-router-dom"

type Props = { title?: string }

export default function AuthHeader({ title = "BlackBill" }: Props) {
  const navigate = useNavigate();
  return (
    <div className="h-[88px] px-6 pt-6">
      <button onClick={()=>navigate('/home')}>
        <img
          src="/logo.png"
          alt="logo"
          className="w-full h-full object-contain"
        />
      </button>
      <div className="mt-2 text-2xl font-semibold">{title}</div>
    </div>
  )
}