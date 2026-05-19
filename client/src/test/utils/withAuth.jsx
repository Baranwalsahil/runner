import { AuthContext } from "../../components/auth/AuthProvider.jsx";

const NOOP = () => {};

export function withAuth(children, { user = null, loading = false } = {}) {
  return (
    <AuthContext.Provider
      value={{
        user,
        token: user ? "tok" : null,
        loading,
        signIn: NOOP,
        signUp: NOOP,
        signOut: NOOP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
