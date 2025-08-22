type Props = { title?: string }
export default function AuthHeader({ title = "BlackBill" }: Props) {
  return (
    <div className="h-[88px] px-6 pt-6">
      <img src="/logo.png" alt="logo" className="w-12 h-12" /> 
      <div className="mt-2 text-2xl font-semibold">{title}</div>
    </div>
  )
}