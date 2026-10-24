import React, { useId, useState, useMemo, useEffect, createContext, useContext } from "react";
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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
type Mode = "light" | "dark";
const ColorMode = createContext<{mode:Mode; toggle:()=>void}>({mode:"light",toggle:()=>{}});
const makeTheme = (mode:Mode) => createTheme({
  palette: {
    mode,
    primary: { main: mode === "dark" ? "#82c5ff" : "#2369ce", dark: "#164fa5", light: "#e5f1ff", contrastText: mode === "dark" ? "#0b203b" : "#ffffff" },
    secondary: {main: "#58b9ec"},
    background: { default: mode === "dark" ? "#0b1425" : "#f2f7fd", paper: mode === "dark" ? "#142238" : "#ffffff" },
    text: { primary: mode === "dark" ? "#e5eefc" : "#172e50", secondary: mode === "dark" ? "#a6bad5" : "#647c9b" },
    divider: mode === "dark" ? "#2a3d57" : "#dce7f5",
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
        root: { background: mode === "dark" ? "#101e32" : "#fff", borderRadius: 8, fontSize: 13 },
        notchedOutline: { borderColor: mode === "dark" ? "#3b506c" : "#cbdcf1" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundImage: "none", borderRadius: 16, boxShadow: "0 24px 100px #020b284d" },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: "#07152a99", backdropFilter: "blur(3px)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, height: 23, fontSize: 10, fontWeight: 550 },
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: mode === "dark" ? "#2a3d57" : "#dce7f5" } } },
  },
});
export function AppTheme({ children }: { children: React.ReactNode }) {
  const [mode,setMode]=useState<Mode>(()=>{try{return localStorage.getItem("stockroom-color-mode")==="dark"?"dark":"light"}catch{return "light"}});
  const theme=useMemo(()=>makeTheme(mode),[mode]);
  useEffect(()=>{document.documentElement.dataset.theme=mode;document.documentElement.style.colorScheme=mode;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",mode==="dark"?"#0b1425":"#2369ce");try{localStorage.setItem("stockroom-color-mode",mode)}catch{}},[mode]);
  return <ColorMode.Provider value={{mode,toggle:()=>setMode(m=>m==="light"?"dark":"light")}}><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></ColorMode.Provider>;
}
export function ThemeToggle(){const{mode,toggle}=useContext(ColorMode);return <FormControlLabel className="theme-toggle" control={<Switch size="small" checked={mode==="dark"} onChange={toggle} slotProps={{input:{"aria-label":"Dark mode"}}}/>} label={mode==="dark"?"Dark mode":"Light mode"}/>}
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
      color={quantity === 0 ? "error" : quantity <= threshold ? "warning" : "info"}
      variant="outlined"
      sx={{fontWeight:600}}
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
        sx={{ boxShadow: 3, backgroundColor: "#205b9b" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
