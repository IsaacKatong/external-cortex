import { useState, type ReactNode, type FormEvent } from "react";
import { BACKGROUND, TEXT_PRIMARY, BORDER, ACCENT } from "../config/colors.js";

export type PasswordPromptProps = {
  onSubmit: (password: string) => void;
  error: string | null;
};

export function PasswordPrompt({ onSubmit, error }: PasswordPromptProps): ReactNode {
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    onSubmit(password);
  }

  return (
    <div
      style={{
        backgroundColor: BACKGROUND,
        color: TEXT_PRIMARY,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1>Enter Password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            padding: "8px 12px",
            fontSize: 16,
            backgroundColor: BACKGROUND,
            color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "8px 24px",
            fontSize: 16,
            backgroundColor: ACCENT,
            color: BACKGROUND,
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Unlock
        </button>
        {error && (
          <p style={{ color: "#ff4444" }}>{error}</p>
        )}
      </form>
    </div>
  );
}
