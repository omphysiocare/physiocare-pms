import { Link as MuiLink } from "@mui/material";
import Link from "next/link";

/** Monospace record ID that links to its detail page. */
export default function IdLink({ id, href }: { id: string; href: string }) {
  return (
    <MuiLink
      component={Link}
      href={href}
      onClick={(event) => event.stopPropagation()}
      underline="hover"
      sx={{ fontWeight: 600, fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", whiteSpace: "nowrap" }}
    >
      {id}
    </MuiLink>
  );
}
