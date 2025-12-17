import { useState, useEffect } from "react";
import { Music, ExternalLink, Link, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const defaultPlaylists = [
  { id: 1, name: "Lo-Fi Study Beats", embedId: "0vvXsWCC9xrXsKd4FyS8kM" },
  { id: 2, name: "Classical Focus", embedId: "1h0CEZCm6IbFTbxThn6Xcs" },
  { id: 3, name: "Ambient Study", embedId: "37i9dQZF1DX3Ogo9pFvBkY" },
  { id: 4, name: "Deep Focus", embedId: "37i9dQZF1DWZeKCadgRdKQ" },
  { id: 5, name: "Peaceful Piano", embedId: "37i9dQZF1DX4sWSpwq3LiO" },
];

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MusicPlayerModal = ({ isOpen, onClose }: MusicPlayerModalProps) => {
  const [currentPlaylist, setCurrentPlaylist] = useState(defaultPlaylists[0]);
  const [customPlaylistUrl, setCustomPlaylistUrl] = useState("");
  const [savedPlaylist, setSavedPlaylist] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("spotifyPlaylistUrl");
    if (saved) {
      setSavedPlaylist(saved);
    }
  }, []);

  const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSaveCustomPlaylist = () => {
    const playlistId = extractPlaylistId(customPlaylistUrl);
    if (playlistId) {
      localStorage.setItem("spotifyPlaylistUrl", customPlaylistUrl);
      setSavedPlaylist(customPlaylistUrl);
      setCurrentPlaylist({ id: 999, name: "My Playlist", embedId: playlistId });
      setShowCustomInput(false);
      toast.success("Playlist saved to your profile!");
    } else {
      toast.error("Invalid Spotify playlist URL");
    }
  };

  const handleRemoveSavedPlaylist = () => {
    localStorage.removeItem("spotifyPlaylistUrl");
    setSavedPlaylist(null);
    setCurrentPlaylist(defaultPlaylists[0]);
    toast.success("Playlist removed");
  };

  const getCurrentEmbedId = () => {
    if (savedPlaylist && currentPlaylist.id === 999) {
      return extractPlaylistId(savedPlaylist) || currentPlaylist.embedId;
    }
    return currentPlaylist.embedId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Music className="w-5 h-5 text-green-500" />
            </div>
            Study Music
          </DialogTitle>
          <DialogDescription>
            Listen to music while you study. Link your own Spotify playlist or choose from our recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Spotify Player */}
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${getCurrentEmbedId()}?utm_source=generator&theme=0`}
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>

          {/* Custom Playlist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Your Playlist</Label>
              {savedPlaylist && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveSavedPlaylist}
                >
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            {savedPlaylist ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground truncate flex-1">{savedPlaylist}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const id = extractPlaylistId(savedPlaylist);
                    if (id) {
                      setCurrentPlaylist({ id: 999, name: "My Playlist", embedId: id });
                    }
                  }}
                >
                  Play
                </Button>
              </div>
            ) : showCustomInput ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://open.spotify.com/playlist/..."
                    value={customPlaylistUrl}
                    onChange={(e) => setCustomPlaylistUrl(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSaveCustomPlaylist}>Save</Button>
                <Button variant="ghost" onClick={() => setShowCustomInput(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCustomInput(true)}
              >
                <Link className="w-4 h-4 mr-2" />
                Link Your Spotify Playlist
              </Button>
            )}
          </div>

          {/* Playlist Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Recommended Playlists</Label>
            <div className="grid grid-cols-2 gap-2">
              {defaultPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setCurrentPlaylist(playlist)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    currentPlaylist.id === playlist.id
                      ? "bg-green-500/10 border-2 border-green-500/50"
                      : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    currentPlaylist.id === playlist.id ? "text-green-500" : "text-foreground"
                  }`}>
                    {playlist.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Open in Spotify */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(`https://open.spotify.com/playlist/${getCurrentEmbedId()}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Spotify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicPlayerModal;
