import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../components/auth/AuthProvider.jsx";
import SignUpForm from "../components/auth/SignUpForm.jsx";

function renderForm({ signUp }) {
  return render(
    <AuthContext.Provider
      value={{ user: null, loading: false, token: null, signIn: () => {}, signUp, signOut: () => {} }}
    >
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<SignUpForm />} />
          <Route path="/dashboard" element={<div data-testid="dash">DASH</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("<SignUpForm>", () => {
  it("calls signUp with all fields and navigates on success", async () => {
    const signUp = vi.fn().mockResolvedValue({ id: "u1" });
    renderForm({ signUp });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "new_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secretsecret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    await waitFor(() => expect(signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      username: "new_user",
      password: "secretsecret",
      color: "#c3f400",
    }));
    await waitFor(() => expect(screen.getByTestId("dash")).toBeInTheDocument());
  });

  it("submits the chosen territory color", async () => {
    const signUp = vi.fn().mockResolvedValue({ id: "u1" });
    renderForm({ signUp });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "new_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secretsecret" },
    });
    // Pick a custom hex color.
    fireEvent.change(screen.getByLabelText(/territory color/i), {
      target: { value: "#ff6b6b" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({ color: "#ff6b6b" })
      )
    );
  });

  it("surfaces error on signUp rejection", async () => {
    const signUp = vi.fn().mockRejectedValue(new Error("Email or username already registered"));
    renderForm({ signUp });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "dup@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "dup_user" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secretsecret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already registered/);
  });
});
