import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { Layout } from "./components/Layout";
describe("vendor route protection", () => {
  beforeEach(() => localStorage.clear());
  it("redirects unauthenticated vendors to sign in", async () => {
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
  });
  it("offers vendor registration", async () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Start selling with Vishwaneed",
      }),
    ).toBeInTheDocument();
  });

  it("opens and closes the responsive navigation", () => {
    localStorage.setItem(
      "vishwaneed.vendor.session",
      JSON.stringify({
        accessToken: "vendor-access",
        refreshToken: "vendor-refresh",
        user: {
          id: "vendor",
          email: "vendor@example.com",
          role: "VENDOR",
        },
      }),
    );
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    );
    expect(container.querySelector("aside")).toHaveClass("open");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(
      screen.getByRole("button", { name: "Close navigation overlay" }),
    );
    expect(container.querySelector("aside")).not.toHaveClass("open");
    expect(document.body.style.overflow).toBe("");
  });
});
