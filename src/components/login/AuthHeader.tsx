import { useNavigate } from "react-router-dom"
import HomeLogo from "../../assets/HomeLogo.png"
import blackBillLogo from "../../assets/blackBillLogo.png"

type Props = { title?: string }

export default function AuthHeader({ title = "BlackBill" }: Props) {
  const navigate = useNavigate();
  return (
    <div className="h-[88px] px-6 pt-6">
      <button onClick={()=>navigate('/home')}>
        <img
          src={HomeLogo}
          alt="logo"
          className="w-[88.55px] h-[88.55px] object-contain"
        />
      </button>
      <img src={blackBillLogo} className="w-[128.81px] h-[29.43px]"/>
    </div>
  )
}