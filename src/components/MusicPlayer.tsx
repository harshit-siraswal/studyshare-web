import { useState } from "react";
import { Music, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MusicPlayerModal from "./MusicPlayerModal";

const playlists = [
  { id: 1, name: "Lo-Fi Beats", embedId: "0vvXsWCC9xrXsKd4FyS8kM" },
  { id: 2, name: "Classical", embedId: "1h0CEZCm6IbFTbxThn6Xcs" },
  { id: 3, name: "Ambient", embedId: "37i9dQZF1DX3Ogo9pFvBkY" },
];

const MusicPlayer = () => {
  const [currentPlaylist, setCurrentPlaylist] = useState(playlists[0]);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Music className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Study Music</h3>
              <p className="text-xs text-muted-foreground">{currentPlaylist.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
            onClick={() => setShowModal(true)}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Open
          </Button>
        </div>

        {/* Spotify Embed - CRITICAL: Must include allow="encrypted-media" */}
        <div className="p-4 bg-black/5">
          <iframe
            key={currentPlaylist.embedId}
            src={`https://open.spotify.com/embed/playlist/${currentPlaylist.embedId}`}
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            title={`Spotify Player - ${currentPlaylist.name}`}
            style={{ borderRadius: '12px', border: 0 }}
          />
        </div>

        {/* Quick Playlist Switcher */}
        <div className="p-4 pt-2 border-t border-border bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Quick Switch</p>
          <div className="flex gap-2 flex-wrap">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => setCurrentPlaylist(playlist)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${currentPlaylist.id === playlist.id
                    ? "bg-green-500 text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
              >
                {playlist.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MusicPlayerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default MusicPlayer;