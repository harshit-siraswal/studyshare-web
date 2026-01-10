import { useState, useEffect } from "react";
import { Music, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Playlist {
  id: number;
  name: string;
  embedId: string;
  isCustom?: boolean;
}

const defaultPlaylists: Playlist[] = [
  { id: 1, name: "Lo-Fi Study Beats", embedId: "0vvXsWCC9xrXsKd4FyS8kM" },
  { id: 2, name: "Classical Focus", embedId: "1h0CEZCm6IbFTbxThn6Xcs" },
  { id: 3, name: "Ambient Study", embedId: "37i9dQZF1DX3Ogo9pFvBkY" },
];

const STORAGE_KEY = "studyspace_custom_playlists";

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistsChange?: (playlists: Playlist[]) => void;
}

const MusicPlayerModal = ({ isOpen, onClose, onPlaylistsChange }: MusicPlayerModalProps) => {
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(defaultPlaylists[0]);
  const [customPlaylistUrl, setCustomPlaylistUrl] = useState("");
  const [customPlaylistName, setCustomPlaylistName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load custom playlists from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomPlaylists(parsed);
      } catch (e) {
        console.error("Failed to parse saved playlists", e);
      }
    }
  }, []);

  // Notify parent when playlists change
  useEffect(() => {
    onPlaylistsChange?.([...defaultPlaylists, ...customPlaylists]);
  }, [customPlaylists, onPlaylistsChange]);

  const allPlaylists = [...defaultPlaylists, ...customPlaylists];

  const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleSaveCustomPlaylist = () => {
    if (!customPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    const playlistId = extractPlaylistId(customPlaylistUrl);
    if (!playlistId) {
      toast.error("Invalid Spotify playlist URL");
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now(),
      name: customPlaylistName.trim(),
      embedId: playlistId,
      isCustom: true,
    };

    const updated = [...customPlaylists, newPlaylist];
    setCustomPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setCurrentPlaylist(newPlaylist);
    setShowCustomInput(false);
    setCustomPlaylistUrl("");
    setCustomPlaylistName("");
    toast.success(`Playlist "${newPlaylist.name}" saved!`);
  };

  const handleDeletePlaylist = (id: number) => {
    const updated = customPlaylists.filter(p => p.id !== id);
    setCustomPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // If deleted was current, switch to default
    if (currentPlaylist.id === id) {
      setCurrentPlaylist(defaultPlaylists[0]);
    }
    toast.success("Playlist removed");
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
              {allPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`p-3 rounded-lg transition-all flex items-center justify-between ${currentPlaylist.id === playlist.id
                    ? "bg-green-500/10 border-2 border-green-500/50"
                    : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                    }`}
                >
                  <button
                    onClick={() => setCurrentPlaylist(playlist)}
                    className="flex-1 text-left"
                  >
                    <p className={`text-sm font-medium ${currentPlaylist.id === playlist.id ? "text-green-500" : "text-foreground"
                      }`}>
                      {playlist.name}
                    </p>
                    {playlist.isCustom && (
                      <p className="text-xs text-muted-foreground">Custom playlist</p>
                    )}
                  </button>
                  {playlist.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
                <div>
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input
                    id="playlist-name"
                    placeholder="My Study Playlist"
                    value={customPlaylistName}
                    onChange={(e) => setCustomPlaylistName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="custom-playlist">Spotify Playlist URL</Label>
                  <Input
                    id="custom-playlist"
                    placeholder="https://open.spotify.com/playlist/..."
                    value={customPlaylistUrl}
                    onChange={(e) => setCustomPlaylistUrl(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCustomPlaylist} className="flex-1">Save Playlist</Button>
                  <Button variant="outline" onClick={() => {
                    setShowCustomInput(false);
                    setCustomPlaylistUrl("");
                    setCustomPlaylistName("");
                  }}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a Spotify playlist link and give it a name
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