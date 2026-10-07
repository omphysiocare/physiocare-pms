"use client";

import { StorefrontOutlined } from "@mui/icons-material";
import { InputAdornment, MenuItem, TextField } from "@mui/material";

import { useBranches } from "@/hooks/useClinic";
import { ALL_BRANCHES, useBranch } from "@/providers/BranchProvider";

/** Global branch scope: one branch, or "All branches" for consolidated views. */
export default function BranchSelector() {
  const { branchId, setBranchId } = useBranch();
  const { data: branches = [] } = useBranches();
  if (branches.length < 2) return null;
  const value = branchId === ALL_BRANCHES || branches.some((b) => b.id === branchId) ? branchId : ALL_BRANCHES;

  return (
    <TextField
      select
      value={value}
      onChange={(event) => setBranchId(event.target.value)}
      fullWidth={false}
      sx={{ minWidth: { xs: 0, sm: 190 }, width: { xs: 56, sm: "auto" }, "& .MuiSelect-select": { display: { xs: "none", sm: "block" } } }}
      slotProps={{
        htmlInput: { "aria-label": "Branch" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <StorefrontOutlined sx={{ fontSize: 20, color: "text.secondary" }} />
            </InputAdornment>
          ),
        },
      }}
    >
      <MenuItem value={ALL_BRANCHES}>All branches</MenuItem>
      {branches
        .filter((branch) => branch.active)
        .map((branch) => (
          <MenuItem key={branch.id} value={branch.id}>
            {branch.name}
          </MenuItem>
        ))}
    </TextField>
  );
}
