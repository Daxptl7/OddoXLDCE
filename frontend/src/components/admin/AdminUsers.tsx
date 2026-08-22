"use client";

import { useState } from "react";
import { useAdminUsers, useSetUserRole } from "@/hooks/useAdmin";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { GuideAvatar } from "@/components/guides/GuideAvatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner, errorMessage } from "@/components/ui/ErrorBanner";
import { CitySearchCombobox } from "@/components/trips/CitySearchCombobox";
import { SearchIcon } from "@/components/ui/Icons";
import type { AdminUser, SerializedCity, UserRole } from "@/lib/types";

const roleFilters: Array<{ value: UserRole | undefined; label: string }> = [
  { value: undefined, label: "Everyone" },
  { value: "USER", label: "Travellers" },
  { value: "GUIDE", label: "Guides" },
  { value: "ADMIN", label: "Admins" },
];

const roleTone: Record<UserRole, "neutral" | "info" | "success"> = {
  USER: "neutral",
  GUIDE: "info",
  ADMIN: "success",
};

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [promoting, setPromoting] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const q = useDebouncedValue(search, 300);
  const { data, isLoading, error: loadError } = useAdminUsers({ q: q || undefined, role });
  const setUserRole = useSetUserRole();

  async function changeRole(user: AdminUser, nextRole: UserRole) {
    // Promoting to guide needs a city when they have no profile yet — ask first.
    if (nextRole === "GUIDE" && !user.guide) {
      setPromoting(user);
      return;
    }
    setError(null);
    try {
      await setUserRole.mutateAsync({ userId: user.id, role: nextRole });
    } catch (roleError) {
      setError(errorMessage(roleError, "Could not change this role"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-3 rounded-full border border-border bg-white px-4 py-2 shadow-sm focus-within:border-foreground sm:max-w-sm [&>div]:flex-1">
          <SearchIcon className="h-5 w-5 text-primary" />
          <Input
            aria-label="Search people"
            placeholder="Name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="border-0 p-0 shadow-none focus:border-0 focus:ring-0"
          />
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto">
          {roleFilters.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setRole(value)}
              className={
                role === value
                  ? "min-w-fit rounded-full bg-foreground px-3.5 py-1.5 text-sm font-bold text-white"
                  : "min-w-fit rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-7 w-7" />
        </div>
      ) : loadError ? (
        <ErrorBanner message={errorMessage(loadError, "Could not load people")} />
      ) : data && data.users.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Person</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Guides in</th>
                <th className="px-4 py-3 font-semibold">Trips</th>
                <th className="px-4 py-3 font-semibold">Bookings</th>
                <th className="px-4 py-3 text-right font-semibold">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GuideAvatar name={user.name} photoUrl={user.photoUrl} className="h-8 w-8" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {user.name}
                            {isSelf ? <span className="ml-1 text-xs text-muted">(you)</span> : null}
                          </p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={roleTone[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.guide?.city?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{user.tripCount}</td>
                    <td className="px-4 py-3 text-muted">{user.bookingCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <select
                          value={user.role}
                          disabled={isSelf || setUserRole.isPending}
                          onChange={(event) => changeRole(user, event.target.value as UserRole)}
                          className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-foreground disabled:opacity-50"
                          aria-label={`Role for ${user.name}`}
                        >
                          <option value="USER">Traveller</option>
                          <option value="GUIDE">Guide</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Nobody matches" description="Try a different search or filter." />
      )}

      <PromoteToGuideModal user={promoting} onClose={() => setPromoting(null)} />
    </div>
  );
}

/** Promoting someone to guide needs the one thing a traveller account never had: an area. */
function PromoteToGuideModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [city, setCity] = useState<SerializedCity | null>(null);
  const [dailyRate, setDailyRate] = useState("3000");
  const [error, setError] = useState<string | null>(null);
  const setUserRole = useSetUserRole();

  if (!user) return null;

  async function onSave() {
    if (!city) {
      setError("Pick the city this guide will cover");
      return;
    }
    setError(null);
    try {
      await setUserRole.mutateAsync({
        userId: user!.id,
        role: "GUIDE",
        cityId: city.id,
        dailyRate: Number(dailyRate),
      });
      setCity(null);
      onClose();
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not promote this person"));
    }
  }

  return (
    <Modal open onClose={onClose} title={`Make ${user.name} a guide`}>
      <div className="flex flex-col gap-4">
        {error ? <ErrorBanner message={error} /> : null}
        <p className="text-sm text-muted">
          They will appear in the guide directory for this city and get the guide workspace on their
          next sign-in.
        </p>
        <CitySearchCombobox value={city} onChange={setCity} />
        <Input
          label="Starting daily rate (₹)"
          type="number"
          min={0}
          step={100}
          value={dailyRate}
          onChange={(event) => setDailyRate(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={setUserRole.isPending}>
            {setUserRole.isPending ? "Saving…" : "Make guide"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
