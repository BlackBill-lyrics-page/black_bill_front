import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export function useSongLikeVM(songId?:number){
    const [likeCount, setLikeCount]=useState(0)
    const [liked, setLiked]=useState(false);
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState("null")
    const navigate = useNavigate(); 

    const getUserId = useCallback(async()=>{
        const {data, error} = await supabase.auth.getUser();
        if (error){
            return null;
        }
        return data.user?.id??null;
    }, []);

    useEffect(()=>{
        let mounted=true;
        if (!songId){
            setError("songId missing");
            return;
        }

        const currentSongId = songId;

        (async()=>{
            try{
                const {count:total, error:countErr}=await supabase // counting likes
                    .from("song_liked")
                    .select("*",{count:"exact", head:true}) //head : not entire row data but metadata
                    .eq("song_id", songId)
                if (countErr){
                    setError("count error")
                    return;
                }

                const uid = await getUserId(); //wheter I liked
                let iLiked = false;
                if (uid) {
                    const {data, error:mineErr}= await supabase  
                        .from("song_liked")
                        .select("song_id")
                        .eq("song_id",songId)
                        .eq("user_id",uid)
                        .limit(1)
                    if (mineErr){
                        setError(mineErr.message);
                        return;
                    }
                    iLiked = !!(data && data.length>0);
                }
                
                if (mounted&& songId===currentSongId){
                    setLikeCount(total??0);
                    setLiked(iLiked);
                    setError("null");
                } 
            } catch (e : any){
                setError(e?.message??"unexpected error");
            }
        })();

        return ()=>{ mounted=false;};
      }, [songId, getUserId]);  
            


    const toggleLike = useCallback(async () => {
    if (!songId) return;
    setLoading(true);
    try {
      const uid = await getUserId();
      if (!uid) {
        navigate("/sign-in?redirect=${encodeURIComponent(location.pathname + location.search)}"); //redirection
        return;
      }

      if (liked) {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1)); // limiting minimum value as 0
        const { error } = await supabase
          .from("song_liked")
          .delete()
          .eq("song_id", songId)
          .eq("user_id", uid);
        if (error) {
          setLiked(true);
          setLikeCount((c) => c + 1);
          console.error(error);
        }
      } 

      else {
        setLiked(true);
        setLikeCount((c) => c + 1);
        const { error } = await supabase
          .from("song_liked")
          .insert([{ song_id: songId, user_id: uid }]);
        if (error) {
          setLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
          console.error(error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [songId, liked, getUserId, navigate]);

  return { likeCount, liked, loading, toggleLike };
}