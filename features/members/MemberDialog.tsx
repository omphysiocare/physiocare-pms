"use client";

import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormHelperText, Stack, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm, type Control } from "react-hook-form";

import { FormSwitch, FormTextField } from "@/components/forms";
import { useBranches } from "@/hooks/useClinic";
import { useInviteMember, useUpdateMember } from "@/hooks/useMembers";
import { PROVIDER_ROLES } from "@/lib/auth/permissions";
import { SPECIALTY_OPTIONS } from "@/lib/specialties";
import { useNotify } from "@/providers/NotificationProvider";
import { MEMBER_ROLES, MEMBER_STATUSES, type Member } from "@/types";

import { MEMBER_COLORS, emptyMemberValues, formValuesToMemberInput, memberSchema, memberToFormValues, type MemberFormValues } from "./schema";

function BranchesField({ control }: { control: Control<MemberFormValues> }) {
  const { data: branches = [] } = useBranches();
  const { field, fieldState } = useController({ control, name: "branchIds" });
  const value: string[] = field.value ?? [];
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">Branches</Typography>
      {branches.map((branch) => (
        <FormControlLabel key={branch.id} control={<Checkbox checked={value.includes(branch.id)} onChange={(e) => field.onChange(e.target.checked ? [...value, branch.id] : value.filter((id) => id !== branch.id))} />} label={branch.name} />
      ))}
      {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
    </Box>
  );
}

function ColorField({ control }: { control: Control<MemberFormValues> }) {
  const { field } = useController({ control, name: "color" });
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>Calendar colour</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {MEMBER_COLORS.map((color) => (
          <Box key={color} component="button" type="button" aria-label={`Colour ${color}`} aria-pressed={field.value === color} onClick={() => field.onChange(color)} sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: color, border: field.value === color ? "3px solid #0F172A" : "2px solid #fff", boxShadow: "0 0 0 1px #E2E8F0", cursor: "pointer" }} />
        ))}
      </Box>
    </Box>
  );
}

/** Invite a new member, or edit an existing one. */
export default function MemberDialog({ member, onClose }: { member?: Member; onClose: () => void }) {
  const notify = useNotify();
  const { data: branches = [] } = useBranches();
  const invite = useInviteMember();
  const update = useUpdateMember(member?.id ?? "");
  const defaults = member ? memberToFormValues(member) : emptyMemberValues(branches.filter((b) => b.isMain).map((b) => b.id));
  const { control, handleSubmit, setValue, formState } = useForm<MemberFormValues>({ resolver: zodResolver(memberSchema), defaultValues: defaults });

  const submit = async (values: MemberFormValues) => {
    try {
      if (member) {
        await update.mutateAsync(formValuesToMemberInput(values));
        notify.success(`${values.name} updated`);
      } else {
        await invite.mutateAsync(formValuesToMemberInput(values));
        notify.success(`Invitation sent to ${values.email}`);
      }
      onClose();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Dialog open onClose={formState.isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogTitle>{member ? `Edit ${member.name}` : "Invite member"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <FormTextField control={control} name="name" label="Full name" required autoFocus />
              <FormTextField control={control} name="email" label="Email" type="email" required />
              <FormTextField control={control} name="mobile" label="Mobile" required />
              <FormTextField control={control} name="role" label="Role" required options={MEMBER_ROLES} onValueChange={(role) => setValue("isProvider", PROVIDER_ROLES.includes(role as Member["role"]))} />
              <FormTextField control={control} name="specialty" label="Specialty" options={[{ value: "", label: "—" }, ...SPECIALTY_OPTIONS]} />
              <FormTextField control={control} name="designation" label="Designation" />
              <FormTextField control={control} name="qualification" label="Qualification" />
              <FormTextField control={control} name="registrationNumber" label="Registration number" />
              <FormTextField control={control} name="joiningDate" label="Joining date" type="date" required />
              {member && <FormTextField control={control} name="status" label="Status" options={MEMBER_STATUSES} />}
            </Box>
            <BranchesField control={control} />
            <FormSwitch control={control} name="isProvider" label="Bookable provider" description="Can be booked for appointments and record clinical services." />
            <ColorField control={control} />
            {!member && <Typography variant="caption" color="text.secondary">An invitation email will be sent. The member appears as Invited until they accept.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose} disabled={formState.isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>{member ? "Save changes" : "Send invitation"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
