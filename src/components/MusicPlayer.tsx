import { useState, useEffect } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import MusicPlayerModal from "./MusicPlayerModal";

const playlists = [
  { id: 1, name: "Lo-Fi Study Beats", embedId: "0vvXsWCC9xrXsKd4FyS8kM" },
  { id: 2, name: "Classical Focus", embedId: "1h0CEZCm6IbFTbxThn6Xcs" },
  { id: 3, name: "Ambient Study", embedId: "37i9dQZF1DX3Ogo9pFvBkY" },
];

const MusicPlayer = () => {
  const [currentPlaylist, setCurrentPlaylist] = useState(playlists[0]);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("spotifyPlaylistUrl");
    if (savedUrl) {
      const match = savedUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        setCurrentPlaylist({ id: 999, name: "My Playlist", embedId: match[1] });
      }
    }
  }, []);

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Music className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm font-medium text-foreground">Study Music</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-500 hover:text-green-400 h-8"
            onClick={() => setShowModal(true)}
          >
            <Maximize2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Open</span>
          </Button>
        </div>

        {/* Spotify Embed - Larger for better control */}
        <div className="p-3 sm:p-4">
          <div className="rounded-lg overflow-hidden bg-black/20">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${currentPlaylist.embedId}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Player Controls */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500 hover:bg-green-400 text-white"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
          </div>
        </div>

        {/* Quick Playlist Selection */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">QUICK SELECT</p>
          <div className="flex gap-1 flex-wrap">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => setCurrentPlaylist(playlist)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  currentPlaylist.id === playlist.id
                    ? "bg-green-500/10 text-green-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {playlist.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MusicPlayerModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default MusicPlayer;
