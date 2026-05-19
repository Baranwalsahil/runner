import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../components/auth/AuthProvider.jsx";
import Auth from "../routes/Auth.jsx";

function renderAuth({ user = null, loading = false } = {}) {
  return render(
    <AuthContext.Provider
      value={{ user, loading, token: user ? "tok" : null, signIn: () => {}, signUp: () => {}, signOut: () => {} }}
    >
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<div data-testid="dash">DASH</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("/auth route", () => {
  it("shows Sign in form by default", () => {
    renderAuth();
    expect(screen.getByRole("heading", { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: /Sign in/ })).toBeInTheDocument();
  });

  it("toggles to Sign up form", () => {
    renderAuth();
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i, hidden: false }));
    expect(screen.getByRole("form", { name: /Sign up/ })).toBeInTheDocument();
  });

  it("redirects to /dashboard when user already signed in", () => {
    renderAuth({ user: { id: "u1", email: "x@x.com", username: "x" } });
    expect(screen.getByTestId("dash")).toBeInTheDocument();
  });

  it("shows Loading while hydrating", () => {
    renderAuth({ loading: true });
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });
});
