"use client";

import { LockOutlined, RestartAltOutlined } from "@mui/icons-material";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { LoadingState, PageHeader, useConfirm } from "@/components/common";
import { FormTextField } from "@/components/forms";
import SettingsCard from "@/features/clinic/SettingsCard";
import { useUpdateMember } from "@/hooks/useMembers";
import { isMockApi } from "@/lib/api/config";
import { resetDb } from "@/lib/api/mock/db";
import { optionalText, phoneNumber, requiredText } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useNotify } from "@/providers/NotificationProvider";
import type { Member } from "@/types";

const schema = z.object({
  name: requiredText("Name", 80),
  email: z.email("Enter a valid email address"),
  mobile: phoneNumber(),
  designation: optionalText(80),
  qualification: optionalText(120),
  registrationNumber: optionalText(60),
});
type Values = z.infer<typeof schema>;

function ProfileForm({ member }: { member: Member }) {
  const notify = useNotify();
  const update = useUpdateMember(member.id);
  const defaults: Values = { name: member.name, email: member.email, mobile: member.mobile, designation: member.designation, qualification: member.qualification, registrationNumber: member.registrationNumber };
  const { control, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const submit = async (values: Values) => {
    try {
      await update.mutateAsync({
        ...values,
        role: member.role,
        specialty: member.specialty,
        joiningDate: member.joiningDate,
        status: member.status,
        branchIds: member.branchIds,
        isProvider: member.isProvider,
        color: member.color,
      });
      reset(values);
      notify.success("Your profile was updated");
    } catch (error) {
      notify.error(error);
    }
  };
  return (
    <SettingsCard title="My Profile" description="How you appear on appointments, prescriptions and the audit log." onSubmit={handleSubmit(submit)} onReset={() => reset(defaults)} isDirty={formState.isDirty} isSubmitting={formState.isSubmitting}>
      <FormTextField control={control} name="name" label="Full name" required />
      <FormTextField control={control} name="email" label="Email" required />
      <FormTextField control={control} name="mobile" label="Mobile" required />
      <FormTextField control={control} name="designation" label="Designation" />
      <FormTextField control={control} name="qualification" label="Qualification" />
      <FormTextField control={control} name="registrationNumber" label="Registration number" />
    </SettingsCard>
  );
}

export default function AccountView() {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { member, session } = useAuth();
  const { confirm, dialog } = useConfirm();

  const resetDemo = async () => {
    if (!(await confirm({ title: "Reset demo data?", description: "All patients, appointments, invoices, settings and members you changed will be replaced with the original demo dataset.", confirmLabel: "Reset data", destructive: true }))) return;
    await resetDb();
    await queryClient.invalidateQueries();
    notify.success("Demo data restored");
    router.push("/dashboard");
  };

  return (
    <>
      <PageHeader title="My Account" description={`Signed in as ${member?.name ?? "…"} · ${session?.role ?? ""}`} />
      {!member ? (
        <LoadingState variant="form" />
      ) : (
        <Stack spacing={3}>
          <ProfileForm key={member.updatedAt} member={member} />
          <SettingsCard title="Security" description="Password, two-factor authentication and sessions." columns={1}>
            <Alert severity="info" icon={<LockOutlined />}>Sign-in and password management will be enabled when authentication is connected to the backend.</Alert>
          </SettingsCard>
          {isMockApi && (
            <SettingsCard title="Demo data" description="This build runs on a mock data layer stored in your browser (IndexedDB)." columns={1}>
              <Typography variant="body2" color="text.secondary">Changes you make are saved locally so you can explore every workflow end to end.</Typography>
              <Button variant="outlined" color="error" startIcon={<RestartAltOutlined />} onClick={resetDemo} sx={{ justifySelf: "start" }}>Reset demo data</Button>
            </SettingsCard>
          )}
        </Stack>
      )}
      {dialog}
    </>
  );
}
