"use client";

import { DeleteOutlined, PhotoCameraOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { useRef } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { useNotify } from "@/providers/NotificationProvider";

const MAX_BYTES = 400_000;

/** Photo/logo picker stored as a data URL (backend will move this to object storage). */
export default function PhotoField<T extends FieldValues>({ control, name, label, square }: { control: Control<T>; name: FieldPath<T>; label: string; square?: boolean }) {
  const { field } = useController({ control, name });
  const notify = useNotify();
  const input = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("Please choose an image file.");
    if (file.size > MAX_BYTES) return notify.error("Image must be smaller than 400 KB.");
    const reader = new FileReader();
    reader.onload = () => field.onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar src={field.value || undefined} variant={square ? "rounded" : "circular"} sx={{ width: 72, height: 72, bgcolor: "grey.100", color: "text.secondary" }}>
        <PhotoCameraOutlined />
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => input.current?.click()}>
            {field.value ? "Change" : "Upload"}
          </Button>
          {field.value && (
            <Button size="small" color="error" startIcon={<DeleteOutlined />} onClick={() => field.onChange(null)}>
              Remove
            </Button>
          )}
        </Box>
        <input ref={input} type="file" accept="image/*" hidden onChange={(event) => onFile(event.target.files?.[0])} />
      </Box>
    </Box>
  );
}
