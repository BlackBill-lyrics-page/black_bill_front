import { useNavigate } from "react-router-dom"
import HomeLogo from "../../assets/HomeLogo.png"
import blackBillLogo from "../../assets/blackBillLogo.png"

type Props = { title?: string }

export default function AuthHeader({ title = "BlackBill" }: Props) {
  const navigate = useNavigate();
  return (
    <div className="h-[120px] px-6 pt-6 flex flex-col items-center">
      <button onClick={() => navigate('/home')}>
        <img
          src={HomeLogo}
          alt="logo"
          className="w-[120px] h-[120px] object-contain"
        />
      </button>
      <img
        src={blackBillLogo}
        className="w-[180px] h-[40px] mt-2"  // 아래쪽에 살짝 여백
      />
    </div>

  )
}