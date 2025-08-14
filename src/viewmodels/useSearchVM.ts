import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

type SearchMode = "name"|"genre"|null;

type ArtistWithGenres = {
  artist_id: number;
  name: string;
  photo_url: string | null;
  genres: { id: number; name: string }[]; // json_agg result
};


export function useSearchVM(){
    const [mode, setModeState] = useState<SearchMode>("name");
    const [selectedGenres, setSelectedGenres] = useState<number[]> ([]);
    const [result, setResult]=useState<ArtistWithGenres[]>([]);
    const [query, setQuery]=useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const noResult = !loading && result.length === 0 && ((mode==="name"&&query.trim().length>=2)||(mode=="genre"&&selectedGenres.length>0));
    const collator = useMemo(() => new Intl.Collator("ko", { sensitivity: "base" }), []); //useMemo 복잡도 낮추기
    const [allGenres, setAllGenres] = useState<{id : number; name:string}[]>([])
    const [genreLoading, setGenreLoading]=useState(false);
    const [recentSearches, setrecentSearches]=useState<string[]>([]);

    const setMode = useCallback((m: SearchMode) => {
      setModeState(m);
      setResult([]);
      setError(null);

      if (m === "genre") setQuery("");
      if (m === "name") setSelectedGenres([]);
    }, []);

    const resetSearch = useCallback(()=>{
        reqIdRef.current++;  //nullify previous requests
        setModeState("name");
        setQuery("");
        setSelectedGenres([]);
        setError(null);
        setLoading(false);
    },[]);

    const toggleGenre=(genreId: number)=>{
        setSelectedGenres(prev=>{ 
            if (prev?.includes(genreId)){
                return prev.filter(id=>id!==genreId);
            }
            else if (prev.length<3){ // 장르 선택 3개제한
                return [...prev, genreId];
            }
            return prev;
        });
    };

    const selectedNames = useMemo( //이름만 가져오기
      () =>
        allGenres
          .filter(g => selectedGenres.includes(g.id))
          .map(g => g.name), 
      [allGenres, selectedGenres]
    );

    //최근 검색어 (5개)
    const fetchRecentSearches = async () => {
        const {data : {user}} = await supabase.auth.getUser();
        if (!user) return;

        const {data, error} = await supabase
            .from("recent_searches")
            .select("query_text")
            .eq("user_id",user.id)
            .order("searched_at", {ascending:false})
            .limit(5); // 이미 db에서 5개 초과시 자동삭제긴함
        
        if (!error && data) {
            setrecentSearches(data.map(item=>item.query_text));
        }
    }

    const handleRecentClick = useCallback((q:string)=>{
        const v = q.trim();
        if (v.length<2) return;

        setMode("name");
        setSelectedGenres([]);
        setQuery(v);
    }, [setMode, setQuery, setSelectedGenres]);

    const saveRecentSearch = useCallback(async (text:string)=>{
        const q = text.trim();
        if (q.length<2) return;
        // const {data : {user}} = await supabase.auth.getUser()
        // if (!user) return;

        await supabase.rpc("save_recent_search", {
            // p_user_id : user.id,
            p_query_text : q,
        });

        fetchRecentSearches();
    }, [fetchRecentSearches]);

    const deleteRecentSearch = useCallback(async (text: string) => {
      const q = text.trim();
      if (q.length < 2) return;
        
      const { error } = await supabase.rpc("delete_recent_search", {
        p_query_text: q,
      });
    
      if (error) {
        console.error("Failed to delete recent search:", error);
        return;
      }
    
      fetchRecentSearches(); // 삭제 후 목록 새로고침
    }, [fetchRecentSearches]);


    const reqIdRef = useRef(0); // avoid the request competition 

    useEffect(()=>{
        let alive = true; //safety : only executed once when mounted
        (async ()=>{
            setGenreLoading(true);
            const {data, error} = await supabase
                .from("genres")
                .select("id, name")
                .order("name", {ascending:true});
            if (!alive) return;
            if (error){
                setError("genre DB failure")
                setAllGenres([]);
            }
            else{
                const sorted = (data ?? []).slice().sort((a, b) => collator.compare(a.name, b.name));
                setAllGenres(sorted);
            }
            setGenreLoading(false);
        })();
        return ()=>{alive=false;};
    },[collator])
    
    const fetchByGenres = useCallback(async () => {

        if(mode !== "genre") return;
        if(selectedGenres.length===0){
            setResult([]);
            return;
        } 

        
        const myId = ++reqIdRef.current;
        setLoading(true);
        setError(null);

        const unique = Array.from(new Set(selectedGenres));
        
        const { data, error } = await supabase
            .rpc("get_artists_with_all_genres", { selected_genres: unique })
            .returns<ArtistWithGenres[]>();
        
        if (myId!==reqIdRef.current) return;
        setLoading(false);

        if (error){
            console.error(error);
            setError(error.message)
            setResult([]);
            return
        }

        const rows: ArtistWithGenres[] = Array.isArray(data) ? data : [];
        const sorted = rows.slice().sort((a, b) =>collator.compare(a.name, b.name));

        setResult(sorted);
    },[mode, selectedGenres, collator]);

    const fetchByName = useCallback(async()=>{
        if(mode !== "name") return;
        if (query.trim().length<2){
            setResult([]);
            return;
        } 

        const myId = ++reqIdRef.current;
        setLoading(true);   
        setError(null);

        const {data, error}= await supabase
            .from("artists")
            .select(`id, name, photo_url,artist_genres(genre_id, genres(id, name))`)
            .ilike("name", `%${query}%`)
            .order("name", {ascending : true})
            .limit(10)
        
        if (myId!==reqIdRef.current) return;
        setLoading(false);

        if (error){
            console.error(error);
            setError(error.message);
            setResult([]);
            return;
        }

        const mapped: ArtistWithGenres[] =
            (data || []).map((item: any) => ({
              artist_id: item.id as number,
              name: item.name as string,
              photo_url: item.photo_url as string|null,
              genres: (item.artist_genres??[]).map((g: any) => ({
                id: g.genres.id as number,
                name: g.genres.name as string,
              })),
            }));

        const sorted = mapped.slice().sort((a, b) => collator.compare(a.name, b.name));
        setResult(sorted);
    },[mode, query, collator]);

    useEffect(()=>{
        if (mode==="genre"){
            fetchByGenres();
        }
    }, [mode, selectedGenres, fetchByGenres]);

    useEffect(()=>{
        if (mode==="name"){
            const timeout = setTimeout(fetchByName, 300); //settimeout : return timeout ID
            return ()=> clearTimeout(timeout);
        }
    },[mode, query, fetchByName]);

    useEffect(() => {
      if (mode === "genre" && selectedGenres.length === 0) setResult([]);
    }, [mode, selectedGenres, fetchByGenres]);
    
    useEffect(() => {
      if (mode === "name" && query.trim() === "") setResult([]);
    }, [mode, query, fetchByName]);

    useEffect(()=>{
        if (selectedGenres.length>0 && mode !=="genre"){
            setMode("genre");
        }
        else if (selectedGenres.length===0 && mode !== "name"){
            setMode("name");
        }
    },[selectedGenres,mode,setMode]);

    useEffect(() => {
      fetchRecentSearches();
    }, []);

    return {
      mode,
      setMode,
      selectedGenres,
      toggleGenre,
      result,
      query,
      setQuery,
      loading,
      error,
      fetchByName,
      fetchByGenres,
      noResult,
      allGenres,
      genreLoading,
      resetSearch,
      selectedNames,
      recentSearches,
      fetchRecentSearches,
      handleRecentClick,
      saveRecentSearch,
      deleteRecentSearch,
    };
}
