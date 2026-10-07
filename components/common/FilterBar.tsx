"use client";

import { Close, Search } from "@mui/icons-material";
import { Box, Button, IconButton, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter controls rendered next to the search field. */
  children?: ReactNode;
  /** Shows a "Clear filters" button when true. */
  hasActiveFilters?: boolean;
  onReset?: () => void;
  resultCount?: number;
  totalCount?: number;
}

/** Consistent search + filter row used at the top of every list table. */
export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
  hasActiveFilters,
  onReset,
  resultCount,
  totalCount,
}: FilterBarProps) {
  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "minmax(240px, 2fr) repeat(auto-fit, minmax(150px, 1fr))" },
          alignItems: "center",
        }}
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          sx={{ gridColumn: { sm: "1 / -1", md: "auto" } }}
          slotProps={{
            htmlInput: { "aria-label": searchPlaceholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 20, color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => onSearchChange("")}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        {children}
      </Box>
      {(resultCount !== undefined || hasActiveFilters) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, minHeight: 28 }}>
          {resultCount !== undefined && (
            <Typography variant="caption" color="text.secondary">
              Showing {resultCount.toLocaleString("en-IN")}
              {totalCount !== undefined && totalCount !== resultCount ? ` of ${totalCount.toLocaleString("en-IN")}` : ""} records
            </Typography>
          )}
          {hasActiveFilters && onReset && (
            <Button size="small" onClick={onReset} startIcon={<Close fontSize="small" />}>
              Clear filters
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

interface FilterSelectProps<V extends string> {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string }[] | readonly V[];
}

export function FilterSelect<V extends string>({ label, value, onChange, options }: FilterSelectProps<V>) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  return (
    <TextField select label={label} value={value} onChange={(event) => onChange(event.target.value as V)}>
      {normalized.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
