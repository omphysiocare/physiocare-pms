"use client";

import { GroupsOutlined, HowToRegOutlined, MailOutlined, MedicalServicesOutlined, PersonAddAltOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, EmptyState, ErrorState, FilterBar, FilterSelect, PageHeader, PersonAvatar, RowActions, StatCard, StatGrid, StatusChip, type Column } from "@/components/common";
import { useBranches } from "@/hooks/useClinic";
import { useMembers } from "@/hooks/useMembers";
import { formatDate } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import { getSpecialty } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";
import { MEMBER_ROLES, MEMBER_STATUSES, type Member } from "@/types";

import { useMemberActions } from "./useMemberActions";

const ALL = "all";

export default function MemberListView() {
  const router = useRouter();
  const { can } = useAuth();
  const { data: members = [], isPending, isError, error, refetch } = useMembers();
  const { data: branches = [] } = useBranches();
  const { rowActions, openInvite, dialogs } = useMemberActions();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? id;

  const filtered = useMemo(() => members.filter((m) => matchesSearch(search, m.name, m.email, m.mobile, m.id, m.registrationNumber) && (role === ALL || m.role === role) && (status === ALL || m.status === status)), [members, search, role, status]);

  const columns: Column<Member>[] = [
    {
      id: "name",
      label: "Member",
      render: (m) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PersonAvatar name={m.name} size={34} sx={{ bgcolor: m.color }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{m.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="p">{m.email}</Typography>
          </Box>
        </Box>
      ),
      sortValue: (m) => m.name,
    },
    { id: "role", label: "Role", render: (m) => <Box><Typography variant="body2">{m.role}</Typography>{m.isProvider && <Chip size="small" variant="outlined" label="Provider" sx={{ mt: 0.25 }} />}</Box>, sortValue: (m) => m.role },
    { id: "specialty", label: "Specialty", render: (m) => (m.specialty ? getSpecialty(m.specialty).name : "—"), hideBelow: "lg" },
    { id: "mobile", label: "Mobile", render: (m) => m.mobile, hideBelow: "md" },
    { id: "reg", label: "Registration no.", render: (m) => m.registrationNumber || "—", hideBelow: "xl" },
    { id: "branches", label: "Branches", render: (m) => m.branchIds.map(branchName).join(", "), hideBelow: "lg" },
    { id: "joined", label: "Joined", render: (m) => formatDate(m.joiningDate), sortValue: (m) => m.joiningDate, hideBelow: "xl" },
    { id: "status", label: "Status", render: (m) => <StatusChip status={m.status} />, sortValue: (m) => m.status },
  ];

  return (
    <>
      <PageHeader
        title="Clinic Members"
        description="Doctors, therapists, front desk and finance team across your branches."
        actions={can("members.create") && <Button variant="contained" startIcon={<PersonAddAltOutlined />} onClick={openInvite}>Invite Member</Button>}
      />
      <StatGrid>
        <StatCard label="Members" value={members.length} icon={<GroupsOutlined />} loading={isPending} />
        <StatCard label="Active" value={members.filter((m) => m.status === "Active").length} icon={<HowToRegOutlined />} tone="success" loading={isPending} />
        <StatCard label="Providers" value={members.filter((m) => m.isProvider && m.status === "Active").length} icon={<MedicalServicesOutlined />} tone="secondary" helper="bookable" loading={isPending} />
        <StatCard label="Pending Invites" value={members.filter((m) => m.status === "Invited").length} icon={<MailOutlined />} tone="warning" loading={isPending} />
      </StatGrid>
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isPending}
          getRowId={(m) => m.id}
          onRowClick={(m) => router.push(`/members/${m.id}`)}
          resetKey={`${search}|${role}|${status}`}
          toolbar={
            <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search name, email, mobile or registration no." hasActiveFilters={search !== "" || role !== ALL || status !== ALL} onReset={() => { setSearch(""); setRole(ALL); setStatus(ALL); }} resultCount={filtered.length} totalCount={members.length}>
              <FilterSelect label="Role" value={role} onChange={setRole} options={[{ value: ALL, label: "All roles" }, ...MEMBER_ROLES.map((r) => ({ value: r, label: r }))]} />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: ALL, label: "All statuses" }, ...MEMBER_STATUSES.map((s) => ({ value: s, label: s }))]} />
            </FilterBar>
          }
          emptyState={<EmptyState title="No members match" icon={<GroupsOutlined />} />}
          renderActions={(m) => <RowActions actions={rowActions(m)} />}
        />
      )}
      {dialogs}
    </>
  );
}
