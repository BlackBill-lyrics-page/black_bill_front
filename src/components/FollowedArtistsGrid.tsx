import { useNavigate } from "react-router-dom";
import type { UIArtist } from "../hooks/useFollowedArtists";

export default function FollowedArtistsGrid({artists}:{artists:UIArtist[]}){
    const navigate= useNavigate();

    if (!artists.length) {
        return <div className="text-gray-500">팔로우한 아티스트가 없습니다.</div>
    }

    return(
        <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {artists.map((a)=>(
                <li
                    key={a.id}
                    onClick={()=>navigate(`/artist/${a.id}`)}
                    className="cursor-pointer group"
                >
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-200">
                        <img
                            src={a.photoUrl || "/default-profile.svg"}
                            alt={a.name}
                            className="w-full h-full object-cover trnasition group-hover:scale-120"
                        />
                    </div>
                    <div className="mt-2 text-center">
                        <div className="text-sm font-medium truncate">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.genre ?? ""}</div>
                    </div>
                </li>
            ))}
        </ul>
    )

}