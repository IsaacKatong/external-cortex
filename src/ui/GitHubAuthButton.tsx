import { useState, type ReactNode } from "react";
import { useGitHubAuth } from "../auth/github-auth/GitHubAuthContext.js";
import { BORDER, TEXT_SECONDARY, ACCENT } from "../config/colors.js";

/**
 * GitHub authentication button.
 *
 * - When signed out: shows an input for pasting a personal access token.
 * - When validating: shows a loading indicator.
 * - When signed in: shows the GitHub username and a sign-out button.
 * - On error: shows the error message with a retry option.
 */
export function GitHubAuthButton(): ReactNode {
  const { auth, signIn, signOut } = useGitHubAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  function handleSubmit(): void {
    const trimmed = tokenInput.trim();
    if (trimmed) {
      signIn(trimmed);
      setTokenInput("");
      setShowInput(false);
    }
  }

  if (auth.status === "validating") {
    return (
      <span style={{ color: TEXT_SECONDARY, fontSize: 14 }}>
        Validating token...
      </span>
    );
  }

  if (auth.status === "signed_in") {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <span style={{ color: TEXT_SECONDARY }}>
          Signed in as <strong style={{ color: ACCENT }}>{auth.username}</strong>
        </span>
        <button
          onClick={signOut}
          style={{
            background: "none",
            border: `1px solid ${BORDER}`,
            color: TEXT_SECONDARY,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          Sign out
        </button>
      </span>
    );
  }

  if (auth.status === "error") {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <span style={{ color: "#e06c75" }}>{auth.errorMessage}</span>
        <button
          onClick={() => setShowInput(true)}
          style={{
            background: "none",
            border: `1px solid ${BORDER}`,
            color: TEXT_SECONDARY,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          Retry
        </button>
      </span>
    );
  }

  // signed_out
  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        style={{
          background: "none",
          border: `1px solid ${BORDER}`,
          color: ACCENT,
          cursor: "pointer",
          padding: "4px 12px",
          borderRadius: 4,
          fontSize: 13,
        }}
      >
        Sign in to GitHub
      </button>
    );
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
      <input
        type="password"
        placeholder="Paste GitHub PAT"
        value={tokenInput}
        onChange={(e) => setTokenInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        style={{
          background: "transparent",
          border: `1px solid ${BORDER}`,
          color: TEXT_SECONDARY,
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: 13,
          width: 220,
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          background: "none",
          border: `1px solid ${ACCENT}`,
          color: ACCENT,
          cursor: "pointer",
          padding: "3px 10px",
          borderRadius: 4,
          fontSize: 13,
        }}
      >
        Connect
      </button>
      <button
        onClick={() => {
          setShowInput(false);
          setTokenInput("");
        }}
        style={{
          background: "none",
          border: "none",
          color: TEXT_SECONDARY,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Cancel
      </button>
    </span>
  );
}
