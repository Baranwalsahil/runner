import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../components/auth/AuthProvider.jsx";
import SignInForm from "../components/auth/SignInForm.jsx";

function renderForm({ signIn }) {
  return render(
    <AuthContext.Provider
      value={{ user: null, loading: false, token: null, signIn, signUp: () => {}, signOut: () => {} }}
    >
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<SignInForm />} />
          <Route path="/dashboard" element={<div data-testid="dash">DASH</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("<SignInForm>", () => {
  it("calls signIn with username + password and navigates on success", async () => {
    const signIn = vi.fn().mockResolvedValue({ id: "u1" });
    renderForm({ signIn });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "demo_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secretsecret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(signIn).toHaveBeenCalledWith({
      username: "demo_user",
      password: "secretsecret",
    }));
    await waitFor(() => expect(screen.getByTestId("dash")).toBeInTheDocument());
  });

  it("shows error message on signIn failure", async () => {
    const signIn = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    renderForm({ signIn });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "demo_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
