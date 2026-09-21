import { useQuery } from "@tanstack/react-query";
import { Bell, KeyRound, Shield } from "lucide-react";
import { api } from "../api/client";
import { AsyncState, Status } from "../components/AsyncState";
import { PageHead } from "./DashboardPage";
interface Notification {
  id: string;
  templateKey: string;
  status: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
export function NotificationsPage() {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
  });
  return (
    <>
      <PageHead
        eyebrow="Updates"
        title="Notifications"
        subtitle="KYC, orders, shipments, complaints and settlement delivery events."
      />
      <AsyncState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.length}
        onRetry={() => void query.refetch()}
      >
        <div className="notification-list">
          {query.data?.map((n) => (
            <article className="card" key={n.id}>
              <Bell />
              <div>
                <strong>{n.templateKey.replaceAll("_", " ")}</strong>
                <p>
                  {Object.entries(n.payload)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" · ")}
                </p>
                <small>{new Date(n.createdAt).toLocaleString("en-IN")}</small>
              </div>
              <Status value={n.status} />
            </article>
          ))}
        </div>
      </AsyncState>
    </>
  );
}
export function SettingsPage() {
  return (
    <>
      <PageHead
        eyebrow="Account"
        title="Security settings"
        subtitle="Your session uses short-lived access tokens and refresh-token rotation through the backend."
      />
      <div className="dashboard-grid">
        <section className="card">
          <Shield />
          <h2>Session security</h2>
          <p className="muted">
            Unauthorized and expired sessions are refreshed once, then safely
            returned to sign-in when refresh is rejected.
          </p>
        </section>
        <section className="card">
          <KeyRound />
          <h2>Password management</h2>
          <p className="muted">
            The backend currently has no vendor password-change or
            password-reset endpoint. No insecure frontend-only password flow has
            been added.
          </p>
        </section>
      </div>
    </>
  );
}
