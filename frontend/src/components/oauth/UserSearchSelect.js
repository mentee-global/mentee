import React, { useCallback, useEffect, useRef, useState } from "react";
import { Select, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { fetchAdminUserSearch, fetchAdminUsersByIds } from "utils/api";
import { ACCOUNT_TYPE_LABELS } from "utils/consts";

const SEARCH_DEBOUNCE_MS = 300;

function formatLabel(user) {
  const name = user?.name || (user?.email ? user.email.split("@")[0] : "?");
  const role =
    user?.role !== undefined && user?.role !== null
      ? ACCOUNT_TYPE_LABELS[Number(user.role)] || `role ${user.role}`
      : "";
  const email = user?.email || "";
  return role ? `${name} <${email}> — ${role}` : `${name} <${email}>`;
}

/**
 * Async multi-select for picking users by email/name. Selected values are
 * ObjectId strings (matching the backend whitelist_user_ids list). Internal
 * state caches option labels so selected chips still render after the
 * dropdown closes, and across edit-view re-renders.
 */
function UserSearchSelect({ value, onChange, placeholder, disabled }) {
  const { t } = useTranslation();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const hydratedIdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const activeSearchRef = useRef(0);

  // Hydrate labels for any preselected ids (e.g. when opening an existing
  // client for edit) so chips aren't just raw ObjectIds.
  useEffect(() => {
    const ids = Array.isArray(value) ? value : [];
    const missing = ids.filter((id) => !hydratedIdsRef.current.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const users = await fetchAdminUsersByIds(missing);
      if (cancelled) return;
      setOptions((prev) => {
        const byId = new Map(prev.map((o) => [o.value, o]));
        for (const u of users) {
          byId.set(u.id, { value: u.id, label: formatLabel(u), user: u });
          hydratedIdsRef.current.add(u.id);
        }
        for (const id of missing) {
          if (!byId.has(id)) {
            byId.set(id, { value: id, label: id });
            hydratedIdsRef.current.add(id);
          }
        }
        return Array.from(byId.values());
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleSearch = useCallback((q) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q) {
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const searchId = ++activeSearchRef.current;
      try {
        const users = await fetchAdminUserSearch({ q, limit: 20 });
        if (searchId !== activeSearchRef.current) return; // stale response
        setOptions((prev) => {
          const byId = new Map(prev.map((o) => [o.value, o]));
          for (const u of users) {
            byId.set(u.id, { value: u.id, label: formatLabel(u), user: u });
          }
          return Array.from(byId.values());
        });
      } finally {
        if (searchId === activeSearchRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  return (
    <Select
      mode="multiple"
      value={value || []}
      onChange={onChange}
      placeholder={
        placeholder || t("admin_oauth.form.whitelist_users_placeholder")
      }
      disabled={disabled}
      showSearch
      filterOption={false}
      onSearch={handleSearch}
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={options}
      style={{ width: "100%" }}
    />
  );
}

export default UserSearchSelect;
