import React, { useId } from "react";
import MuiButton from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import MuiSelect from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Chip from "@mui/material/Chip";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { ThemeProvider, createTheme } from "@mui/material/styles";
const theme = createTheme({
  palette: {
    primary: { main: "#196c55", dark: "#104f3e", light: "#eaf4ee" },
    background: { default: "#f7f9f8", paper: "#fff" },
    text: { primary: "#253c35", secondary: "#7b8b83" },
    divider: "#e1e7e2",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 13,
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 38, borderRadius: 8, gap: 8 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { background: "#fff", borderRadius: 8, fontSize: 13 },
        notchedOutline: { borderColor: "#dce3df" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: "0 24px 100px #1c3b382b" },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: "#152e2566", backdropFilter: "blur(3px)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, height: 23, fontSize: 10, fontWeight: 550 },
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: "#edf1ed" } } },
  },
});
export function AppTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
export function Button({
  className = "",
  type = "button",
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">) {
  if (className.split(" ").includes("icon"))
    return (
      <IconButton
        {...props}
        type={type}
        size="small"
        className={className}
        color={className.includes("danger") ? "error" : "default"}
      />
    );
  return (
    <MuiButton
      {...props}
      type={type}
      className={className}
      variant={
        className.includes("secondary")
          ? "outlined"
          : className.includes("text-button") ||
              className.includes("nav-button")
            ? "text"
            : "contained"
      }
      size="small"
    />
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { min, max, step, "aria-label": aria, ...rest } = props;
  return (
    <TextField
      {...(rest as any)}
      fullWidth
      size="small"
      slotProps={{ htmlInput: { min, max, step, "aria-label": aria } }}
    />
  );
}
export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <TextField {...(props as any)} fullWidth size="small" multiline />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { name, children, id, "aria-label": aria, ...rest } = props;
  return (
    <FormControl size="small" className="mui-select">
      <MuiSelect
        native
        {...(rest as any)}
        name={name}
        inputProps={{ "aria-label": aria, id }}
      >
        {children}
      </MuiSelect>
    </FormControl>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const fieldId = useId();
  const child = children as React.ReactElement<{ id?: string }>;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {React.cloneElement(child, { id: fieldId })}
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      open
      onClose={close}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      className="inventory-dialog"
    >
      <DialogTitle component="div">
        <header>
          <div>
            <span className="eyebrow">STOCKROOM</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <IconButton aria-label="Close dialog" onClick={close}>
            ×
          </IconButton>
        </header>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
export function StockBadge({
  quantity,
  threshold,
}: {
  quantity: number;
  threshold: number;
}) {
  const state =
    quantity === 0
      ? "Out of stock"
      : quantity <= threshold
        ? "Low stock"
        : "In stock";
  return (
    <Chip
      className="stock-chip"
      size="small"
      label={state}
      sx={{
        backgroundColor:
          quantity === 0
            ? "#faeeea"
            : quantity <= threshold
              ? "#fbf4df"
              : "#edf5ef",
        color:
          quantity === 0
            ? "#b9786b"
            : quantity <= threshold
              ? "#a2863c"
              : "#51886a",
      }}
    />
  );
}
export function Feedback({
  message,
  clear,
}: {
  message: string;
  clear: () => void;
}) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={4500}
      onClose={clear}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        variant="filled"
        severity="success"
        onClose={clear}
        sx={{ boxShadow: 3 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
