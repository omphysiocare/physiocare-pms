"use client";

import { ExpandMore, HelpOutlineOutlined, Search, SupportAgentOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, Chip, InputAdornment, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, LoadingState, PageHeader } from "@/components/common";
import { useFaqs } from "@/hooks/useAccount";
import { matchesSearch } from "@/lib/search";
import { FAQ_CATEGORIES, type FaqCategory } from "@/types";

export default function FaqView() {
  const { data: faqs = [], isPending } = useFaqs();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "All">("All");
  const filtered = useMemo(() => faqs.filter((f) => (category === "All" || f.category === category) && matchesSearch(search, f.question, f.answer)), [faqs, search, category]);

  return (
    <>
      <PageHeader title="FAQs" description="Answers to common questions about using the PMS." actions={<Button variant="outlined" startIcon={<SupportAgentOutlined />} component={Link} href="/support">Contact support</Button>} />
      <Card sx={{ p: 2, mb: 2 }}>
        <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" slotProps={{ htmlInput: { "aria-label": "Search FAQs" }, input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
          {(["All", ...FAQ_CATEGORIES] as const).map((c) => <Chip key={c} label={c} clickable color={category === c ? "primary" : "default"} variant={category === c ? "filled" : "outlined"} onClick={() => setCategory(c)} />)}
        </Box>
      </Card>
      {isPending ? (
        <LoadingState variant="list" />
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={<HelpOutlineOutlined />} title="No matching questions" description="Try other words, or open a support ticket." action={<Button component={Link} href="/support" variant="contained">Open a ticket</Button>} /></Card>
      ) : (
        filtered.map((faq) => (
          <Accordion key={faq.id} disableGutters sx={{ border: 1, borderColor: "divider", "&:before": { display: "none" }, mb: 1, borderRadius: "12px !important" }} elevation={0}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>{faq.category}</Typography>
                <Typography variant="subtitle2">{faq.question}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails><Typography variant="body2" color="text.secondary">{faq.answer}</Typography></AccordionDetails>
          </Accordion>
        ))
      )}
    </>
  );
}
