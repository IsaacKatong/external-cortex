import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { GitHubAuthState, GitHubAuthContextValue } from "./types.js";
import { saveToken, loadToken, clearToken } from "./tokenStorage.js";
import { validateToken } from "./validateToken.js";

const INITIAL_STATE: GitHubAuthState = {
  token: null,
  username: null,
  status: "signed_out",
  errorMessage: null,
};

const GitHubAuthContext = createContext<GitHubAuthContextValue>({
  auth: INITIAL_STATE,
  signIn: async () => {},
  signOut: () => {},
});

export type GitHubAuthProviderProps = {
  children: ReactNode;
};

/**
 * Provides GitHub authentication state to the component tree.
 *
 * On mount, checks localStorage for a previously saved token and validates
 * it. Exposes `signIn` (accepts a PAT, validates, and stores it) and
 * `signOut` (clears the stored token).
 */
export function GitHubAuthProvider({
  children,
}: GitHubAuthProviderProps): ReactNode {
  const [auth, setAuth] = useState<GitHubAuthState>(INITIAL_STATE);

  // On mount, check for a stored token and validate it
  useEffect(() => {
    const stored = loadToken();
    if (!stored) return;

    setAuth({
      token: stored,
      username: null,
      status: "validating",
      errorMessage: null,
    });

    validateToken(stored)
      .then((username) => {
        setAuth({
          token: stored,
          username,
          status: "signed_in",
          errorMessage: null,
        });
      })
      .catch(() => {
        clearToken();
        setAuth({
          token: null,
          username: null,
          status: "signed_out",
          errorMessage: null,
        });
      });
  }, []);

  const signIn = useCallback(async (token: string): Promise<void> => {
    setAuth({
      token: null,
      username: null,
      status: "validating",
      errorMessage: null,
    });

    try {
      const username = await validateToken(token);
      saveToken(token);
      setAuth({ token, username, status: "signed_in", errorMessage: null });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setAuth({
        token: null,
        username: null,
        status: "error",
        errorMessage: message,
      });
    }
  }, []);

  const signOut = useCallback((): void => {
    clearToken();
    setAuth(INITIAL_STATE);
  }, []);

  return (
    <GitHubAuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </GitHubAuthContext.Provider>
  );
}

/**
 * Hook to access the GitHub authentication context.
 */
export function useGitHubAuth(): GitHubAuthContextValue {
  return useContext(GitHubAuthContext);
}
