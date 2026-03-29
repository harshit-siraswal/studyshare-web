import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getDepartmentMeta, type DepartmentMeta } from "@/lib/departmentMeta";
import { cn } from "@/lib/utils";

type DepartmentAvatarSize = "sm" | "md" | "lg" | "xl" | "hero";

const AVATAR_SIZE_CLASSES: Record<DepartmentAvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
  hero: "h-24 w-24",
};

const ICON_SIZE_CLASSES: Record<DepartmentAvatarSize, string> = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
  hero: "h-9 w-9",
};

type DepartmentAvatarProps = {
  department?: string | null;
  meta?: DepartmentMeta;
  size?: DepartmentAvatarSize;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

export default function DepartmentAvatar({
  department,
  meta,
  size = "md",
  className,
  fallbackClassName,
  iconClassName,
}: DepartmentAvatarProps) {
  const departmentMeta = meta ?? getDepartmentMeta(department);
  const Icon = departmentMeta.icon;

  return (
    <Avatar
      className={cn(
        "border border-border/60 shadow-sm",
        AVATAR_SIZE_CLASSES[size],
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "border border-white/10",
          departmentMeta.avatarClassName,
          fallbackClassName
        )}
      >
        <Icon
          className={cn(
            ICON_SIZE_CLASSES[size],
            departmentMeta.iconClassName,
            iconClassName
          )}
        />
      </AvatarFallback>
    </Avatar>
  );
}
