// App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import EmailSignUpPage from './pages/EmailSignUpPage'
import SignUpPage from './pages/SignUpPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import SetProfileArtist from './pages/SetProfileArtist'
import SignInPage from './pages/SignInPage'
import MyAudience from './pages/MyAudiencePage'
import MyArtistPage from './pages/MyArtistPage'
import ArtistPage from './pages/ArtistPage'
import SearchPage from './pages/SearchPage'
import Header from "./components/Header";
import HomePage from './pages/HomePage'

function AppContent() {
  const location = useLocation();
  const noHeaderRoutes = ["/sign-in", "/sign-up", "/sign-up_email"];

  return (
    <>
      {!noHeaderRoutes.includes(location.pathname) && <Header />}

      <Routes>
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-up_email" element={<EmailSignUpPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/set-profile-artist" element={<SetProfileArtist />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/my_audience" element={<MyAudience />} />
        <Route path="/my_artist" element={<MyArtistPage />} />
        <Route path="/artist/:id" element={<ArtistPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
