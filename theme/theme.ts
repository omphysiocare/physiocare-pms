import { alpha, createTheme } from "@mui/material/styles";

/** Brand and semantic colors — the only palette modules may use. */
export const colors = {
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  secondary: "#0F766E",
  secondaryLight: "#F0FDFA",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
  info: "#0284C7",
} as const;

/**
 * Categorical chart palette in fixed order (validated for colour-vision
 * deficiency separation). Assign series in this order; never cycle.
 */
export const chartColors = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"] as const;

/** Layout dimensions shared by the app shell. */
export const layout = {
  sidebarWidth: 264,
  headerHeight: 64,
  contentMaxWidth: 1440,
} as const;

const fontFamily = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(",");

export const theme = createTheme({
  palette: {
    primary: { main: colors.primary, light: "#60A5FA", dark: "#1D4ED8", contrastText: "#FFFFFF" },
    secondary: { main: colors.secondary, light: "#14B8A6", dark: "#115E59", contrastText: "#FFFFFF" },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
    info: { main: colors.info },
    background: { default: colors.background, paper: colors.surface },
    text: { primary: colors.text, secondary: colors.textSecondary, disabled: colors.textMuted },
    divider: colors.border,
    grey: { 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1", 400: "#94A3B8", 500: "#64748B" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, fontSize: "2rem" },
    h2: { fontWeight: 700, fontSize: "1.75rem" },
    h3: { fontWeight: 700, fontSize: "1.5rem" },
    h4: { fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.01em" },
    h5: { fontWeight: 700, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1rem" },
    subtitle1: { fontWeight: 600, fontSize: "0.9375rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
    body1: { fontSize: "0.9375rem" },
    body2: { fontSize: "0.875rem" },
    caption: { fontSize: "0.75rem" },
    overline: { fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.background, WebkitFontSmoothing: "antialiased" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap" },
        sizeMedium: { minHeight: 40, paddingInline: 16 },
        sizeSmall: { minHeight: 32 },
        outlined: { borderColor: colors.border, "&:hover": { borderColor: colors.borderStrong } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 12 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { padding: 20, "&:last-child": { paddingBottom: 20 } } },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
    },
    MuiFormControl: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: colors.surface,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: colors.borderStrong },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: "0.875rem" } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
        sizeSmall: { height: 24, fontSize: "0.75rem" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: colors.border, fontSize: "0.875rem", paddingTop: 12, paddingBottom: 12 },
        head: {
          backgroundColor: colors.background,
          color: colors.textSecondary,
          fontWeight: 600,
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&.MuiTableRow-hover:hover": { backgroundColor: alpha(colors.primary, 0.03) } },
      },
    },
    MuiTablePagination: {
      styleOverrides: { root: { borderTop: `1px solid ${colors.border}` } },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 2, borderRadius: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: "none", fontWeight: 600, fontSize: "0.875rem", paddingInline: 12 },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: "1.125rem", fontWeight: 700 } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { border: `1px solid ${colors.border}`, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: "0.875rem", minHeight: 38, gap: 10 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: colors.text, fontSize: "0.75rem" } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiAvatar: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
});
