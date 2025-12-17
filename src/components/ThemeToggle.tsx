import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle = ({ showLabel = false, className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleTheme}
      className={className}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4" />
          {showLabel && <span className="ml-2">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          {showLabel && <span className="ml-2">Dark Mode</span>}
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
