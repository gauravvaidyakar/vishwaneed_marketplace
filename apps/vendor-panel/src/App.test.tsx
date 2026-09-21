import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthProvider";
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
});
