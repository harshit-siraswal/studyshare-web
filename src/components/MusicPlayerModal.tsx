import { useState } from "react";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const playlists = [
  { id: 1, name: "Lo-Fi Study Beats", embedId: "0vvXsWCC9xrXsKd4FyS8kM" },
  { id: 2, name: "Classical Focus", embedId: "1h0CEZCm6IbFTbxThn6Xcs" },
  { id: 3, name: "Ambient Study", embedId: "37i9dQZF1DX3Ogo9pFvBkY" },
];

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MusicPlayerModal = ({ isOpen, onClose }: MusicPlayerModalProps) => {
  const [currentPlaylist, setCurrentPlaylist] = useState(playlists[0]);
  const [customPlaylistUrl, setCustomPlaylistUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSaveCustomPlaylist = () => {
    const playlistId = extractPlaylistId(customPlaylistUrl);
    if (playlistId) {
      setCurrentPlaylist({ id: 999, name: "Custom Playlist", embedId: playlistId });
      setShowCustomInput(false);
      setCustomPlaylistUrl("");
      toast.success("Custom playlist loaded!");
    } else {
      toast.error("Invalid Spotify playlist URL");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Music className="w-5 h-5 text-green-500" />
            </div>
            Study Music Player
          </DialogTitle>
          <DialogDescription>
            Choose from curated playlists or add your own Spotify playlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Spotify Player - CRITICAL: Must include allow="encrypted-media" */}
          <div className="rounded-xl overflow-hidden border border-border bg-black/5">
            <iframe
              key={currentPlaylist.embedId}
              src={`https://open.spotify.com/embed/playlist/${currentPlaylist.embedId}`}
              width="100%"
              height="380"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              loading="lazy"
              title={`Spotify Player - ${currentPlaylist.name}`}
              style={{ borderRadius: '12px', border: 0 }}
            />
          </div>

          {/* Playlist Options */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose Playlist</Label>
            <div className="grid grid-cols-1 gap-2">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setCurrentPlaylist(playlist)}
                  className={`p-3 rounded-lg text-left transition-all ${currentPlaylist.id === playlist.id
                      ? "bg-green-500/10 border-2 border-green-500/50"
                      : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                    }`}
                >
                  <p className={`text-sm font-medium ${currentPlaylist.id === playlist.id ? "text-green-500" : "text-foreground"
                    }`}>
                    {playlist.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Playlist */}
          <div className="border-t pt-4">
            {!showCustomInput ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCustomInput(true)}
              >
                Add Custom Spotify Playlist
              </Button>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="custom-playlist">Spotify Playlist URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-playlist"
                    placeholder="https://open.spotify.com/playlist/..."
                    value={customPlaylistUrl}
                    onChange={(e) => setCustomPlaylistUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveCustomPlaylist}>Add</Button>
                  <Button variant="outline" onClick={() => {
                    setShowCustomInput(false);
                    setCustomPlaylistUrl("");
                  }}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a Spotify playlist link to use it
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MusicPlayerModal;