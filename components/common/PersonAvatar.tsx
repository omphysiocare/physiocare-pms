import { Avatar, type AvatarProps } from "@mui/material";

import { getInitials } from "@/lib/format";
import { chartColors } from "@/theme/theme";

/** Picks a stable color per name so the same person always looks the same. */
function colorFor(name: string): string {
  const palette = [chartColors[0], chartColors[2], chartColors[6], chartColors[1], "#0F766E"];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

interface PersonAvatarProps extends AvatarProps {
  name: string;
  size?: number;
}

export default function PersonAvatar({ name, size = 36, sx, ...props }: PersonAvatarProps) {
  return (
    <Avatar
      sx={[{ width: size, height: size, fontSize: size * 0.38, bgcolor: colorFor(name) }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      {getInitials(name)}
    </Avatar>
  );
}
