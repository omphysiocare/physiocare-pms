"use client";

import { Search } from "@mui/icons-material";
import { Autocomplete, Box, InputAdornment, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalSearch } from "@/hooks/useInsights";
import type { SearchResult, SearchResultType } from "@/services/searchService";
import { colors } from "@/theme/theme";

const GROUP_LABELS: Record<SearchResultType, string> = {
  patient: "Patients",
  appointment: "Appointments",
  consultation: "Consultations",
  serviceRecord: "Clinical services",
  invoice: "Invoices",
  expense: "Expenses",
  member: "Members",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { data = [], isFetching } = useGlobalSearch(input);
  const hasQuery = input.trim().length >= 2;

  return (
    <Autocomplete<SearchResult, false, false, false>
      sx={{ width: { xs: "100%", sm: 340, md: 420 } }}
      options={hasQuery ? data : []}
      value={null}
      inputValue={input}
      onInputChange={(_, value, reason) => reason !== "reset" && setInput(value)}
      onChange={(_, option) => {
        if (!option) return;
        setInput("");
        router.push(option.href);
      }}
      filterOptions={(options) => options}
      groupBy={(option) => GROUP_LABELS[option.type]}
      getOptionLabel={(option) => option.title}
      isOptionEqualToValue={(option, value) => option.type === value.type && option.id === value.id}
      loading={isFetching}
      noOptionsText={hasQuery ? "No matching records" : "Type at least 2 characters"}
      clearOnBlur
      blurOnSelect
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={key} {...rest}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {option.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="p">
                {option.subtitle}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search patients, IDs, invoices…"
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { bgcolor: colors.background },
            },
            htmlInput: { ...params.slotProps.htmlInput, "aria-label": "Global search" },
          }}
        />
      )}
    />
  );
}
