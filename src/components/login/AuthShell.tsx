type Props = {children : React.ReactNode}
export default function AuthShell({children} : Props){
    return(
        <div className="min-h-screen bg-gray-100 px-6 flex items-center justify-center">
            {children}
        </div>
    )
}