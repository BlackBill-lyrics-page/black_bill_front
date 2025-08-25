import clsx from "clsx"

type Props = { children: React.ReactNode; className?: string }

export default function AuthCard({ children, className }: Props) {
  return (
    <div
      className={clsx(
        "w-full max-w-sm min-h-[620px] rounded-2xl shadow-md bg-white",
        "p-0 overflow-hidden flex flex-col",
        "transition-[background-color,box-shadow,transform] duration-300",
        className
      )}
    >
      {children}
    </div>
  )
}