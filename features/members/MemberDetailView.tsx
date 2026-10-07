"use client";

import { AdminPanelSettingsOutlined, BadgeOutlined, CalendarMonthOutlined, DeleteOutlined, EditOutlined, EmailOutlined, HowToRegOutlined, PersonOffOutlined, PhoneOutlined, StorefrontOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";

import { ActivityTimeline, DetailHero, DetailLayout, DetailList, PageHeader, PersonAvatar, QueryBoundary, QuickActions, SectionCard, StatCard, StatGrid, StatusChip } from "@/components/common";
import { useBranches } from "@/hooks/useClinic";
import { useMember, useRoles } from "@/hooks/useMembers";
import { PERMISSION_GROUPS } from "@/lib/auth/permissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getSpecialty } from "@/lib/specialties";
import { useAuth } from "@/providers/AuthProvider";

import { useMemberActions } from "./useMemberActions";

export default function MemberDetailView({ id }: { id: string }) {
  const query = useMember(id);
  const { can } = useAuth();
  const { data: branches = [] } = useBranches();
  const { data: roles = [] } = useRoles();
  const { toggle, remove, openEdit, dialogs } = useMemberActions({ redirectAfterRemove: "/members" });

  return (
    <QueryBoundary query={query} resource="Member" backHref="/members">
      {(member) => {
        const rolePermissions = roles.find((r) => r.role === member.role);
        return (
          <>
            <PageHeader
              title="Member Profile"
              description={`${member.id} · Joined ${formatDate(member.joiningDate)}`}
              backHref="/members"
              backLabel="Members"
              actions={can("members.edit") && <Button variant="contained" startIcon={<EditOutlined />} onClick={() => openEdit(member)}>Edit</Button>}
            />
            <DetailHero
              avatar={<PersonAvatar name={member.name} size={64} sx={{ bgcolor: member.color }} />}
              title={member.name}
              badges={<><StatusChip status={member.status} />{member.isProvider && <Chip size="small" variant="outlined" label="Provider" />}</>}
              subtitle={`${member.role}${member.designation ? ` · ${member.designation}` : ""}${member.specialty ? ` · ${getSpecialty(member.specialty).name}` : ""}`}
              meta={[
                { icon: <EmailOutlined />, label: "Email", value: member.email },
                { icon: <PhoneOutlined />, label: "Mobile", value: member.mobile },
                { icon: <BadgeOutlined />, label: "Registration no.", value: member.registrationNumber || "—" },
                { icon: <StorefrontOutlined />, label: "Branches", value: member.branchIds.map((b) => branches.find((x) => x.id === b)?.name ?? b).join(", ") },
              ]}
            />
            <StatGrid>
              <StatCard label="Appointments" value={member.stats.appointments} icon={<CalendarMonthOutlined />} helper="all time" />
              <StatCard label="Consultations" value={member.stats.consultations} icon={<BadgeOutlined />} tone="secondary" />
              <StatCard label="Services completed" value={member.stats.services} icon={<HowToRegOutlined />} tone="success" />
              <StatCard label="Revenue contribution" value={formatCurrency(member.stats.revenue)} icon={<StorefrontOutlined />} tone="info" helper="collections on their invoices" />
            </StatGrid>
            <DetailLayout
              main={
                <>
                  <SectionCard title="Details">
                    <DetailList
                      items={[
                        { label: "Role", value: member.role },
                        { label: "Designation", value: member.designation },
                        { label: "Qualification", value: member.qualification },
                        { label: "Specialty", value: member.specialty ? getSpecialty(member.specialty).name : "—" },
                        { label: "Joining date", value: formatDate(member.joiningDate) },
                        { label: "Last active", value: member.lastActiveAt ? formatDateTime(member.lastActiveAt) : "—" },
                      ]}
                    />
                  </SectionCard>
                  <SectionCard title="Role permissions" subtitle={rolePermissions?.description} icon={<AdminPanelSettingsOutlined />} action={can("permissions.manage") && <Button size="small" component={Link} href={`/permissions?role=${member.role}`}>Manage</Button>}>
                    {PERMISSION_GROUPS.map((group) => {
                      const granted = group.permissions.filter((p) => rolePermissions?.locked || rolePermissions?.permissions.includes(p.key));
                      if (!granted.length) return null;
                      return (
                        <Box key={group.module} sx={{ mb: 1.25 }}>
                          <Typography variant="caption" color="text.secondary">{group.module}</Typography>
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>{granted.map((p) => <Chip key={p.key} size="small" label={p.label} />)}</Box>
                        </Box>
                      );
                    })}
                  </SectionCard>
                  <SectionCard title="Recent activity" disablePadding>
                    <ActivityTimelineForMember memberId={member.id} />
                  </SectionCard>
                </>
              }
              aside={
                <QuickActions
                  actions={[
                    { label: "Edit member", icon: <EditOutlined />, onClick: () => openEdit(member), hidden: !can("members.edit") },
                    { label: member.status === "Active" ? "Deactivate" : "Activate", icon: member.status === "Active" ? <PersonOffOutlined /> : <HowToRegOutlined />, onClick: () => toggle(member), hidden: !can("members.edit") },
                    { label: "Performance report", icon: <CalendarMonthOutlined />, href: "/reports/members", hidden: !can("reports.view") },
                    { label: "Remove member", icon: <DeleteOutlined />, onClick: () => remove(member), destructive: true, hidden: !can("members.remove") },
                  ]}
                />
              }
            />
            {dialogs}
          </>
        );
      }}
    </QueryBoundary>
  );
}

function ActivityTimelineForMember({ memberId }: { memberId: string }) {
  // Activity entries reference records, so a member's own trail comes from the audit report.
  return (
    <Box>
      <ActivityTimeline recordId={memberId} limit={10} />
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Button size="small" component={Link} href="/reports/activity">Open full audit log</Button>
      </Box>
    </Box>
  );
}
