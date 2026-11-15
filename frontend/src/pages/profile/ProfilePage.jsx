import { useEffect, useState } from "react";
import {
  UserRound,
  Save,
  Clock3,
  ShieldCheck,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Server,
} from "lucide-react";

import { BASE_URL } from "../../services/api/client";
import "./ProfilePage.css";

export default function ProfilePage({ apiStatus = "checking" }) {
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

  const initials = (savedName || name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const statusLabels = {
    live: "Connected",
    offline: "Offline",
    checking: "Checking",
  };

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch(`${BASE_URL}/api/profile`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load profile information.");
        }

        const data = await response.json();

        if (active) {
          setName(data.name || "");
          setSavedName(data.name || "");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to save profile.",
        );
      }

      setName(data.name);
      setSavedName(data.name);
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = name.trim() !== savedName;

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <span className="profile-eyebrow">ACCOUNT</span>
          <h1>Profile</h1>
          <p>Manage your personal information and application preferences.</p>
        </div>
      </header>

      <div className="profile-layout">
        <div className="profile-main">
          {/* Personal information */}
          <section className="profile-panel profile-editor">
            <div className="profile-panel-heading">
              <div className="profile-heading-icon">
                <UserRound size={19} />
              </div>

              <div>
                <h2>Personal information</h2>
                <p>Your profile details and display name.</p>
              </div>
            </div>

            {loading ? (
              <div className="profile-loading">
                <span className="profile-spinner" />
                Loading profile...
              </div>
            ) : (
              <>
                <div className="profile-identity">
                  <div className="profile-avatar">{initials || "U"}</div>

                  <div className="profile-identity-text">
                    <strong>{savedName || "Your profile"}</strong>
                    <span>Personal account</span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="profile-form">
                  <div className="profile-field">
                    <label htmlFor="profile-name">Display name</label>

                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                        setMessage("");
                      }}
                      placeholder="Enter your name"
                      maxLength={100}
                    />

                    <span className="profile-field-hint">
                      This name is displayed across your TradeAlert profile.
                    </span>
                  </div>

                  {error && (
                    <div className="profile-feedback error">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="profile-feedback success">
                      <CheckCircle2 size={16} />
                      {message}
                    </div>
                  )}

                  <div className="profile-form-footer">
                    <span className="profile-save-hint">
                      {hasChanges
                        ? "You have unsaved changes"
                        : "All changes saved"}
                    </span>

                    <button
                      type="submit"
                      className="profile-save-button"
                      disabled={saving || !hasChanges || !name.trim()}
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>

          {/* Account information */}
          <section className="profile-panel">
            <div className="profile-panel-heading">
              <div className="profile-heading-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <h2>Account information</h2>
                <p>Configuration of your TradeAlert account.</p>
              </div>
            </div>

            <div className="profile-info-list">
              <div className="profile-info-row">
                <span>Account type</span>
                <strong>Personal account</strong>
              </div>

              <div className="profile-info-row">
                <span>Authentication</span>
                <strong className="profile-muted-value">Not configured</strong>
              </div>

              <div className="profile-info-row">
                <span>Profile name</span>
                <strong>{savedName || "Not set"}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="profile-side">
          <section className="profile-panel">
            <div className="profile-panel-heading">
              <div className="profile-heading-icon">
                <Monitor size={19} />
              </div>

              <div>
                <h2>Environment</h2>
                <p>Application information.</p>
              </div>
            </div>

            <div className="profile-info-list">
              <div className="profile-info-row">
                <span>Application</span>
                <strong>TradeAlert</strong>
              </div>

              <div className="profile-info-row">
                <span>Platform</span>
                <strong>Web dashboard</strong>
              </div>

              <div className="profile-info-row">
                <span>Timezone</span>
                <strong className="profile-value-with-icon">
                  <Clock3 size={14} />
                  {timezone}
                </strong>
              </div>
            </div>
          </section>

          <section className="profile-panel profile-system-panel">
            <div className="profile-panel-heading">
              <div className="profile-heading-icon">
                <Server size={19} />
              </div>

              <div>
                <h2>Backend connection</h2>
                <p>API connectivity status.</p>
              </div>
            </div>

            <div className="profile-connection">
              <span className={`profile-status-dot ${apiStatus}`} />

              <div>
                <strong>{statusLabels[apiStatus] || "Checking"}</strong>
                <span>FastAPI backend</span>
              </div>

              <span className={`profile-status-label ${apiStatus}`}>
                {statusLabels[apiStatus] || "Checking"}
              </span>
            </div>
          </section>

          <div className="profile-storage-note">
            <ShieldCheck size={17} />
            <p>
              Your profile information is stored in the TradeAlert backend
              database.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
