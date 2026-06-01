import React, { useEffect, useMemo, useState } from "react";
import { Col, Layout, Row, Tabs, Typography } from "antd";
import { useTranslation } from "react-i18next";
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";

import KpiTile from "components/dashboard/KpiTile";
import ChartCard from "components/dashboard/ChartCard";
import HygieneAlert from "components/dashboard/HygieneAlert";

import { PALETTE, STATUS_COLORS, colorFor } from "utils/chartjs-setup"; // also has Chart.register side effects
import { useAuth } from "utils/hooks/useAuth";

import {
  fetchDashboardAcceptanceRates,
  fetchDashboardAppointmentsByMonth,
  fetchDashboardApplicationsByMonth,
  fetchDashboardCountries,
  fetchDashboardCrisisStatus,
  fetchDashboardErrorsByDay,
  fetchDashboardIdentify,
  fetchDashboardMentorFlags,
  fetchDashboardMentorSpecializations,
  fetchDashboardMessagesByDay,
  fetchDashboardOauthTokensByDay,
  fetchDashboardSummary,
  fetchDashboardTopErrorEndpoints,
  fetchDashboardTopExceptions,
  fetchDashboardTopMentors,
  fetchDashboardTopPartners,
  fetchDashboardTopics,
} from "utils/api";

const { Content } = Layout;
const { Title } = Typography;

// ---------- shared helpers -------------------------------------------------

// Fires the loader only once Firebase auth has hydrated. Without this gate
// the first render's fetches race the token, the Authorization header is
// undefined, and the backend returns 401.
const useApi = (loader, ready = true) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setState({
            data: null,
            loading: false,
            error:
              err?.response?.data?.message || err?.message || "Network error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return state;
};

const pct = (num, denom) => {
  if (!denom) return null;
  return Math.round((num / denom) * 1000) / 10;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    Number(value || 0)
  );

const chartValue = (context) => {
  const parsed = context.parsed;
  if (typeof parsed === "number") return parsed;
  if (parsed && typeof parsed.x === "number") return parsed.x;
  if (parsed && typeof parsed.y === "number") return parsed.y;
  return Number(context.raw || 0);
};

const chartDenominator = (context) => {
  if (context.dataset.denominator) return context.dataset.denominator;
  return (context.chart?.data?.datasets || []).reduce((total, dataset) => {
    return (
      total +
      (dataset.data || []).reduce((sum, item) => sum + Number(item || 0), 0)
    );
  }, 0);
};

const countPercentTooltip = {
  callbacks: {
    label: (context) => {
      const label = context.dataset.label || context.label || "";
      const value = chartValue(context);
      const denominator = chartDenominator(context);
      const percentage = pct(value, denominator);
      const suffix = denominator
        ? ` (${percentage}% of ${formatNumber(denominator)})`
        : "";
      return `${label ? `${label}: ` : ""}${formatNumber(value)}${suffix}`;
    },
  },
};

const withCountPercentTooltip = (options) => ({
  ...options,
  plugins: {
    ...(options.plugins || {}),
    tooltip: countPercentTooltip,
  },
});

const subtitle = (...parts) => parts.filter(Boolean).join(" · ");

const metaSubtitle = (meta, fallbackSource, fallbackScope) =>
  subtitle(
    `Source: ${fallbackSource}`,
    meta?.scope || fallbackScope,
    meta?.total !== undefined ? `n=${formatNumber(meta.total)}` : null
  );

const horizontalBarOptions = {
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
};

const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
  interaction: { intersect: false, mode: "index" },
  scales: { y: { beginAtZero: true } },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right" } },
};

const horizontalCountOptions = withCountPercentTooltip(horizontalBarOptions);
const stackedCountOptions = withCountPercentTooltip(stackedBarOptions);
const doughnutCountOptions = withCountPercentTooltip(doughnutOptions);

// ---------- chart-data shapers --------------------------------------------

const rolesToDoughnut = (byRole) => {
  if (!byRole) return null;
  const labels = byRole.map((r) => r.label);
  const data = byRole.map((r) => r.count);
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((l, i) => colorFor(l, i)),
        borderWidth: 0,
      },
    ],
  };
};

const funnelToStacked = (buckets) => {
  if (!buckets || !buckets.length) return null;
  const labels = buckets.map((b) => b.month);
  return {
    labels,
    datasets: [
      {
        label: "Approved",
        data: buckets.map((b) => b.approved || 0),
        backgroundColor: STATUS_COLORS.approved,
      },
      {
        label: "Completed",
        data: buckets.map((b) => b.completed || 0),
        backgroundColor: STATUS_COLORS.completed,
      },
      {
        label: "Build profile",
        data: buckets.map((b) => b.build_profile || 0),
        backgroundColor: STATUS_COLORS.build_profile,
      },
      {
        label: "Rejected",
        data: buckets.map((b) => b.rejected || 0),
        backgroundColor: STATUS_COLORS.rejected,
      },
    ],
  };
};

const topToHorizontal = (
  items,
  label,
  valueKey = "count",
  labelKey = "value"
) => {
  if (!items || !items.length) return null;
  const denominator = items.reduce(
    (total, item) => total + Number(item[valueKey] || 0),
    0
  );
  return {
    labels: items.map((i) => String(i[labelKey] ?? "")),
    datasets: [
      {
        label,
        data: items.map((i) => i[valueKey] || 0),
        denominator,
        backgroundColor: items.map((_, i) => PALETTE[i % PALETTE.length]),
      },
    ],
  };
};

const appointmentsToDoughnut = (appts) => {
  if (!appts) return null;
  return {
    labels: ["Accepted", "Denied", "Pending", "Unknown"],
    datasets: [
      {
        data: [
          appts.accepted || 0,
          appts.denied || 0,
          appts.pending || 0,
          appts.unknown || 0,
        ],
        denominator:
          (appts.accepted || 0) +
          (appts.denied || 0) +
          (appts.pending || 0) +
          (appts.unknown || 0),
        backgroundColor: [
          STATUS_COLORS.accepted,
          STATUS_COLORS.denied,
          STATUS_COLORS.pending,
          "#bfbfbf",
        ],
        borderWidth: 0,
      },
    ],
  };
};

const messagesToLine = (buckets) => {
  if (!buckets || !buckets.length) return null;
  return {
    labels: buckets.map((b) => b.day),
    datasets: [
      {
        label: "Total",
        data: buckets.map((b) => b.messages),
        borderColor: PALETTE[0],
        backgroundColor: "rgba(22,119,255,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: "Read",
        data: buckets.map((b) => b.read),
        borderColor: STATUS_COLORS.read,
        backgroundColor: "rgba(82,196,26,0.15)",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: "Unread",
        data: buckets.map((b) => b.unread || 0),
        borderColor: STATUS_COLORS.unread,
        backgroundColor: "rgba(250,173,20,0.15)",
        fill: false,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };
};

const identityToDoughnut = (result) => {
  const items = result?.items;
  if (!items || !items.length) return null;
  const denominator =
    result?.meta?.total ||
    items.reduce((total, row) => total + Number(row.count || 0), 0);
  return {
    labels: items.map((r) => r.value),
    datasets: [
      {
        data: items.map((r) => r.count),
        denominator,
        backgroundColor: items.map((r, i) => colorFor(r.value, i)),
        borderWidth: 0,
      },
    ],
  };
};

const errorsToStacked = (buckets) => {
  if (!buckets || !buckets.length) return null;
  return {
    labels: buckets.map((b) => b.day),
    datasets: [
      {
        label: "Backend",
        data: buckets.map((b) => b.backend || 0),
        backgroundColor: STATUS_COLORS.backend,
      },
      {
        label: "Frontend",
        data: buckets.map((b) => b.frontend || 0),
        backgroundColor: STATUS_COLORS.frontend,
      },
    ],
  };
};

const tokensToLine = (buckets) => {
  if (!buckets || !buckets.length) return null;
  return {
    labels: buckets.map((b) => b.day),
    datasets: [
      {
        label: "Refresh tokens issued",
        data: buckets.map((b) => b.issued),
        borderColor: PALETTE[5],
        backgroundColor: "rgba(19,194,194,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };
};

const acceptanceToBar = (rows) => {
  if (!rows || !rows.length) return null;
  return {
    labels: rows.map(
      (r) => r.mentor_name || `${(r.mentor_id || "").slice(0, 8)}…`
    ),
    datasets: [
      {
        label: "Acceptance rate (%)",
        data: rows.map((r) => Math.round((r.acceptance_rate || 0) * 1000) / 10),
        backgroundColor: rows.map((r) => {
          const rate = (r.acceptance_rate || 0) * 100;
          if (rate >= 60) return STATUS_COLORS.accepted;
          if (rate >= 30) return STATUS_COLORS.pending;
          return STATUS_COLORS.denied;
        }),
      },
    ],
  };
};

const flagsToBar = (flags) => {
  if (!flags || !flags.total) return null;
  const total = flags.total;
  const items = [
    ["Person of color", flags.color],
    ["Marginalized", flags.marginalized],
    ["Family native", flags.native],
    ["Economically disadvantaged", flags.economically],
    ["Immigrant", flags.immigrant],
  ];
  return {
    labels: items.map(([l]) => l),
    datasets: [
      {
        label: "% of mentor applicants",
        data: items.map(([, v]) => Math.round(((v || 0) / total) * 1000) / 10),
        backgroundColor: PALETTE.slice(0, items.length),
      },
    ],
  };
};

const partnerLabel = (row) =>
  row.organization ||
  row.person_name ||
  `${(row.partner_id || "").slice(0, 8)}…`;

const partnersToBar = (rows) => {
  if (!rows || !rows.length) return null;
  return {
    labels: rows.map(partnerLabel),
    datasets: [
      {
        label: "Applications",
        data: rows.map((r) => r.applications),
        backgroundColor: rows.map((_, i) => PALETTE[i % PALETTE.length]),
      },
    ],
  };
};

const oauthSessionsToBar = (rows) => {
  if (!rows || !rows.length) return null;
  return {
    labels: rows.map((r) => r.client_id),
    datasets: [
      {
        label: "Active sessions",
        data: rows.map((r) => r.active_sessions),
        backgroundColor: rows.map((_, i) => PALETTE[i % PALETTE.length]),
      },
    ],
  };
};

// ---------- section shell --------------------------------------------------

const DASHBOARD_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "applications", label: "Applications" },
  { key: "users", label: "Users" },
  { key: "appointments", label: "Appointments" },
  { key: "messages", label: "Messages" },
  { key: "ops", label: "Ops" },
];

const KpiGrid = ({ kpis, loading, skeletonCount = 6 }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    {kpis.length === 0
      ? Array.from({ length: skeletonCount }).map((_, i) => (
          <Col key={i} xs={12} sm={8} md={6} lg={3}>
            <KpiTile loading title="…" />
          </Col>
        ))
      : kpis.map((k, i) => (
          <Col key={i} xs={12} sm={8} md={6} lg={3}>
            <KpiTile {...k} loading={loading} />
          </Col>
        ))}
  </Row>
);

const useSummary = (section, authReady) =>
  useApi(() => fetchDashboardSummary(section), authReady);

function OverviewSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("overview", authReady);
  const s = summary.data;
  const rolesData = rolesToDoughnut(s?.users?.by_role);
  const apptsStatusData = appointmentsToDoughnut(s?.appointments);
  const kpis = useMemo(() => {
    if (!s) return [];
    return [
      { title: t("dashboard.kpi.totalUsers"), value: s.users.total },
      {
        title: t("dashboard.kpi.mentees"),
        value: s.users.profile_counts.mentee_profile,
        hint: "Completed mentee profiles",
      },
      {
        title: t("dashboard.kpi.mentors"),
        value: s.users.profile_counts.mentor_profile,
        hint: "Completed mentor profiles",
      },
      {
        title: t("dashboard.kpi.avgMessages"),
        value: s.messaging.average_per_day_30d,
        hint: t("dashboard.kpi.messages30d", { count: s.messaging.last_30d }),
      },
      {
        title: t("dashboard.kpi.unreadMessages"),
        value: s.messaging.unread,
        hint: t("dashboard.kpi.unreadAgeHint", {
          conversations: s.messaging.unread_conversations,
          old: s.messaging.unread_48h,
        }),
        valueStyle: s.messaging.unread > 0 ? { color: "#d48806" } : undefined,
      },
      {
        title: t("dashboard.kpi.pendingPast"),
        value: s.appointments.pending_past_timeslot,
        hint: t("dashboard.kpi.pendingPastHint"),
        valueStyle:
          s.appointments.pending_past_timeslot > 0
            ? { color: "#cf1322" }
            : undefined,
      },
      {
        title: t("dashboard.kpi.pendingSoon"),
        value: s.appointments.pending_next_7d,
        hint: t("dashboard.kpi.pendingSoonHint"),
        valueStyle:
          s.appointments.pending_next_7d > 0 ? { color: "#d48806" } : undefined,
      },
      {
        title: t("dashboard.kpi.openBugs"),
        value: s.ops.bugs_open,
        hint: s.ops.oldest_bug_age_days
          ? t("dashboard.kpi.oldestBugDays", {
              days: s.ops.oldest_bug_age_days,
            })
          : null,
        valueStyle: s.ops.bugs_open > 0 ? { color: "#d48806" } : undefined,
      },
      {
        title: t("dashboard.kpi.errors7d"),
        value: s.ops.errors_7d,
        hint: t("dashboard.kpi.errorsTotal", { total: s.ops.errors_total }),
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={9} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.roles")}
            subtitle="Source: Users · All roles · All time"
            type="doughnut"
            data={rolesData}
            options={doughnutCountOptions}
            loading={summary.loading}
            error={summary.error}
            height={260}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.apptStatus")}
            subtitle="Source: Appointment requests · All time"
            type="doughnut"
            data={apptsStatusData}
            options={doughnutCountOptions}
            loading={summary.loading}
            error={summary.error}
            height={260}
          />
        </Col>
      </Row>
    </>
  );
}

function ApplicationsSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("applications", authReady);
  const menteeFunnel = useApi(
    () => fetchDashboardApplicationsByMonth("mentee"),
    authReady
  );
  const mentorFunnel = useApi(
    () => fetchDashboardApplicationsByMonth("mentor"),
    authReady
  );
  const countries = useApi(() => fetchDashboardCountries(15), authReady);
  const topics = useApi(() => fetchDashboardTopics(15), authReady);
  const crisis = useApi(() => fetchDashboardCrisisStatus(10), authReady);
  const menteeApplicantIdentify = useApi(
    () => fetchDashboardIdentify("mentee", "applications"),
    authReady
  );
  const mentorFlags = useApi(fetchDashboardMentorFlags, authReady);
  const partnersMentee = useApi(
    () => fetchDashboardTopPartners("mentee", 10),
    authReady
  );
  const partnersMentor = useApi(
    () => fetchDashboardTopPartners("mentor", 10),
    authReady
  );
  const s = summary.data;
  const kpis = useMemo(() => {
    if (!s) return [];
    const menteeFunnelCounts = s.funnel?.mentee || {};
    const mentorFunnelCounts = s.funnel?.mentor || {};
    const menteeTotal = Object.values(menteeFunnelCounts).reduce(
      (a, b) => a + b,
      0
    );
    const mentorApproved = mentorFunnelCounts.APPROVED || 0;
    const mentorBuildProfile = mentorFunnelCounts.BuildProfile || 0;
    const menteeConversion = s.conversion?.mentee || {};
    const mentorConversion = s.conversion?.mentor || {};
    return [
      {
        title: t("dashboard.kpi.menteeApproval"),
        value: pct(menteeFunnelCounts.APPROVED || 0, menteeTotal),
        suffix: "%",
      },
      {
        title: t("dashboard.kpi.menteeConversion"),
        value: menteeConversion.profile_conversion_rate,
        suffix: "%",
        hint: t("dashboard.kpi.profileConversionHint", {
          created: menteeConversion.profile_created_from_approved || 0,
          approved: menteeConversion.approved_or_later || 0,
        }),
      },
      {
        title: t("dashboard.kpi.mentorConversion"),
        value: mentorConversion.profile_conversion_rate,
        suffix: "%",
        hint: t("dashboard.kpi.profileConversionHint", {
          created: mentorConversion.profile_created_from_approved || 0,
          approved: mentorConversion.approved_or_later || 0,
        }),
      },
      {
        title: t("dashboard.kpi.menteesNoProfile"),
        value: menteeConversion.approved_without_profile,
        hint: t("dashboard.kpi.approvedNoProfileHint"),
        valueStyle:
          menteeConversion.approved_without_profile > 0
            ? { color: "#d48806" }
            : undefined,
      },
      {
        title: t("dashboard.kpi.mentorsNoProfile"),
        value: mentorConversion.approved_without_profile,
        hint: t("dashboard.kpi.approvedNoProfileHint"),
        valueStyle:
          mentorConversion.approved_without_profile > 0
            ? { color: "#d48806" }
            : undefined,
      },
      {
        title: t("dashboard.kpi.mentorDropoff"),
        value: pct(mentorBuildProfile, mentorApproved + mentorBuildProfile),
        suffix: "%",
        hint: t("dashboard.kpi.mentorDropoffHint"),
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={6} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.menteeFunnel")}
            subtitle="Source: Mentee applications · Last 12 months"
            type="bar"
            data={funnelToStacked(menteeFunnel.data)}
            options={stackedCountOptions}
            loading={menteeFunnel.loading}
            error={menteeFunnel.error}
            height={300}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.mentorFunnel")}
            subtitle="Source: Mentor applications · Last 12 months"
            type="bar"
            data={funnelToStacked(mentorFunnel.data)}
            options={stackedCountOptions}
            loading={mentorFunnel.loading}
            error={mentorFunnel.error}
            height={300}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12} lg={8}>
          <ChartCard
            title={t("dashboard.charts.countries")}
            subtitle="Source: Mentee applications · Top 15 shown"
            type="bar"
            data={topToHorizontal(countries.data, "Applicants")}
            options={horizontalCountOptions}
            loading={countries.loading}
            error={countries.error}
            height={320}
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <ChartCard
            title={t("dashboard.charts.topics")}
            subtitle="Source: Mentee applications · Multi-select · Top 15 shown"
            type="bar"
            data={topToHorizontal(topics.data, "Requests")}
            options={horizontalCountOptions}
            loading={topics.loading}
            error={topics.error}
            height={320}
          />
        </Col>
        <Col xs={24} md={24} lg={8}>
          <ChartCard
            title={t("dashboard.charts.crisis")}
            subtitle="Source: Mentee applications · Multi-select · Top 10 shown"
            type="bar"
            data={topToHorizontal(crisis.data, "Mentees")}
            options={horizontalCountOptions}
            loading={crisis.loading}
            error={crisis.error}
            height={320}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.menteeIdentify")}
            subtitle={metaSubtitle(
              menteeApplicantIdentify.data?.meta,
              "Mentee applications",
              "All statuses"
            )}
            type="doughnut"
            data={identityToDoughnut(menteeApplicantIdentify.data)}
            options={doughnutCountOptions}
            loading={menteeApplicantIdentify.loading}
            error={menteeApplicantIdentify.error}
            height={320}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.mentorFlags")}
            subtitle="Source: Mentor applications · All statuses"
            type="bar"
            data={flagsToBar(mentorFlags.data)}
            options={horizontalBarOptions}
            loading={mentorFlags.loading}
            error={mentorFlags.error}
            height={320}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.topPartnersMentee")}
            subtitle="Source: Mentee applications · Top 10 shown"
            type="bar"
            data={partnersToBar(partnersMentee.data)}
            options={horizontalCountOptions}
            loading={partnersMentee.loading}
            error={partnersMentee.error}
            height={300}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.topPartnersMentor")}
            subtitle="Source: Mentor applications · Top 10 shown"
            type="bar"
            data={partnersToBar(partnersMentor.data)}
            options={horizontalCountOptions}
            loading={partnersMentor.loading}
            error={partnersMentor.error}
            height={300}
          />
        </Col>
      </Row>
    </>
  );
}

function UsersSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("users", authReady);
  const mentorSpecs = useApi(
    () => fetchDashboardMentorSpecializations(15),
    authReady
  );
  const menteeProfileIdentify = useApi(
    () => fetchDashboardIdentify("mentee", "profiles"),
    authReady
  );
  const s = summary.data;
  const kpis = useMemo(() => {
    if (!s) return [];
    return [
      { title: t("dashboard.kpi.totalUsers"), value: s.users.total },
      {
        title: t("dashboard.kpi.mentees"),
        value: s.users.profile_counts.mentee_profile,
        hint: "Completed mentee profiles",
      },
      {
        title: t("dashboard.kpi.mentors"),
        value: s.users.profile_counts.mentor_profile,
        hint: "Completed mentor profiles",
      },
      {
        title: t("dashboard.kpi.partners"),
        value: s.users.profile_counts.partner_profile,
        hint: "Completed partner profiles",
      },
      {
        title: t("dashboard.kpi.hubs"),
        value: s.users.profile_counts.hub,
        hint: "Hub profiles",
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={5} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.roles")}
            subtitle="Source: Users · All roles · All time"
            type="doughnut"
            data={rolesToDoughnut(s?.users?.by_role)}
            options={doughnutCountOptions}
            loading={summary.loading}
            error={summary.error}
            height={320}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.menteeProfileGender")}
            subtitle={metaSubtitle(
              menteeProfileIdentify.data?.meta,
              "Mentee profiles",
              "Current profiles"
            )}
            type="doughnut"
            data={identityToDoughnut(menteeProfileIdentify.data)}
            options={doughnutCountOptions}
            loading={menteeProfileIdentify.loading}
            error={menteeProfileIdentify.error}
            height={320}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <ChartCard
            title={t("dashboard.charts.mentorSpecs")}
            subtitle="Source: Mentor profiles · Multi-select · Top 15 shown"
            type="bar"
            data={topToHorizontal(mentorSpecs.data, "Mentors")}
            options={horizontalCountOptions}
            loading={mentorSpecs.loading}
            error={mentorSpecs.error}
            height={320}
          />
        </Col>
      </Row>
    </>
  );
}

function AppointmentsSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("appointments", authReady);
  const apptsByMonth = useApi(
    () => fetchDashboardAppointmentsByMonth(12),
    authReady
  );
  const topMentors = useApi(() => fetchDashboardTopMentors(10), authReady);
  const acceptance = useApi(
    () => fetchDashboardAcceptanceRates(3, 20),
    authReady
  );
  const s = summary.data;
  const kpis = useMemo(() => {
    if (!s) return [];
    return [
      { title: "Accepted appointments", value: s.appointments.accepted },
      { title: "Pending appointments", value: s.appointments.pending },
      { title: "Denied appointments", value: s.appointments.denied },
      {
        title: t("dashboard.kpi.pendingPast"),
        value: s.appointments.pending_past_timeslot,
        hint: t("dashboard.kpi.pendingPastHint"),
        valueStyle:
          s.appointments.pending_past_timeslot > 0
            ? { color: "#cf1322" }
            : undefined,
      },
      {
        title: t("dashboard.kpi.pendingSoon"),
        value: s.appointments.pending_next_7d,
        hint: t("dashboard.kpi.pendingSoonHint"),
        valueStyle:
          s.appointments.pending_next_7d > 0 ? { color: "#d48806" } : undefined,
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={5} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12} lg={8}>
          <ChartCard
            title={t("dashboard.charts.apptStatus")}
            subtitle="Source: Appointment requests · All time"
            type="doughnut"
            data={appointmentsToDoughnut(s?.appointments)}
            options={doughnutCountOptions}
            loading={summary.loading}
            error={summary.error}
            height={300}
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <ChartCard
            title={t("dashboard.charts.topMentors")}
            subtitle="Source: Appointment requests · All time · Top 10 shown"
            type="bar"
            data={topToHorizontal(
              topMentors.data?.map((m) => ({
                value: m.mentor_name || `${(m.mentor_id || "").slice(0, 8)}…`,
                count: m.appointments,
              })),
              "Sessions"
            )}
            options={horizontalCountOptions}
            loading={topMentors.loading}
            error={topMentors.error}
            height={300}
          />
        </Col>
        <Col xs={24} md={24} lg={8}>
          <ChartCard
            title={t("dashboard.charts.acceptanceRates")}
            subtitle="Source: Appointment requests · Minimum 3 requests"
            type="bar"
            data={acceptanceToBar(acceptance.data)}
            options={{
              ...horizontalBarOptions,
              scales: { x: { beginAtZero: true, max: 100 } },
            }}
            loading={acceptance.loading}
            error={acceptance.error}
            height={300}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <ChartCard
            title={t("dashboard.charts.apptsByMonth")}
            subtitle="Source: Appointment requests · Last 12 months"
            type="bar"
            data={(() => {
              const buckets = apptsByMonth.data;
              if (!buckets || !buckets.length) return null;
              return {
                labels: buckets.map((b) => b.month),
                datasets: [
                  {
                    label: "Accepted",
                    data: buckets.map((b) => b.accepted || 0),
                    backgroundColor: STATUS_COLORS.accepted,
                  },
                  {
                    label: "Pending",
                    data: buckets.map((b) => b.pending || 0),
                    backgroundColor: STATUS_COLORS.pending,
                  },
                  {
                    label: "Denied",
                    data: buckets.map((b) => b.denied || 0),
                    backgroundColor: STATUS_COLORS.denied,
                  },
                ],
              };
            })()}
            options={stackedCountOptions}
            loading={apptsByMonth.loading}
            error={apptsByMonth.error}
            height={260}
          />
        </Col>
      </Row>
    </>
  );
}

function MessagesSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("messages", authReady);
  const messages = useApi(() => fetchDashboardMessagesByDay(90), authReady);
  const s = summary.data;
  const kpis = useMemo(() => {
    if (!s) return [];
    return [
      {
        title: t("dashboard.kpi.avgMessages"),
        value: s.messaging.average_per_day_30d,
        hint: t("dashboard.kpi.messages30d", { count: s.messaging.last_30d }),
      },
      { title: "Messages last 24h", value: s.messaging.last_24h },
      { title: "Messages last 7d", value: s.messaging.last_7d },
      {
        title: t("dashboard.kpi.unreadMessages"),
        value: s.messaging.unread,
        hint: t("dashboard.kpi.unreadAgeHint", {
          conversations: s.messaging.unread_conversations,
          old: s.messaging.unread_48h,
        }),
        valueStyle: s.messaging.unread > 0 ? { color: "#d48806" } : undefined,
      },
      {
        title: t("dashboard.kpi.unread7d"),
        value: s.messaging.unread_7d,
        hint: t("dashboard.kpi.unread7dHint"),
        valueStyle:
          s.messaging.unread_7d > 0 ? { color: "#cf1322" } : undefined,
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={5} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <ChartCard
            title={t("dashboard.charts.messagesByDay")}
            subtitle="Source: Direct messages · Last 90 days"
            type="line"
            data={messagesToLine(messages.data)}
            options={lineOptions}
            loading={messages.loading}
            error={messages.error}
            height={320}
          />
        </Col>
      </Row>
    </>
  );
}

function OpsSection({ authReady }) {
  const { t } = useTranslation();
  const summary = useSummary("ops", authReady);
  const errorsByDay = useApi(() => fetchDashboardErrorsByDay(30), authReady);
  const topExceptions = useApi(
    () => fetchDashboardTopExceptions(10),
    authReady
  );
  const topErrEndpoints = useApi(
    () => fetchDashboardTopErrorEndpoints(10),
    authReady
  );
  const oauthTokens = useApi(
    () => fetchDashboardOauthTokensByDay(60),
    authReady
  );
  const s = summary.data;
  const hygieneAlerts = useMemo(() => {
    const hygiene = s?.hygiene;
    if (!hygiene) return [];
    const out = [];
    if (hygiene.notifications.total) {
      const unreadPct = pct(
        hygiene.notifications.unread,
        hygiene.notifications.total
      );
      if (unreadPct >= 80) {
        out.push({
          title: t("dashboard.hygiene.unreadNotifications", {
            pct: unreadPct,
          }),
          description: t("dashboard.hygiene.unreadNotificationsDesc"),
        });
      }
    }
    if (hygiene.appointments_legacy.legacy_only > 0) {
      const legacyPct = pct(
        hygiene.appointments_legacy.legacy_only,
        hygiene.appointments_legacy.total
      );
      out.push({
        title: t("dashboard.hygiene.legacyAppts", { pct: legacyPct }),
        description: t("dashboard.hygiene.legacyApptsDesc"),
      });
    }
    if (hygiene.signed_docs_training_id.sampled > 0) {
      const resolvedPct = pct(
        hygiene.signed_docs_training_id.resolved,
        hygiene.signed_docs_training_id.sampled
      );
      if (resolvedPct < 50) {
        out.push({
          title: t("dashboard.hygiene.danglingSigned", { pct: resolvedPct }),
          description: t("dashboard.hygiene.danglingSignedDesc"),
        });
      }
    }
    if (hygiene.users_dirty_role_count > 0) {
      out.push({
        title: t("dashboard.hygiene.dirtyRoles", {
          count: hygiene.users_dirty_role_count,
        }),
        description: t("dashboard.hygiene.dirtyRolesDesc"),
      });
    }
    return out;
  }, [s, t]);
  const kpis = useMemo(() => {
    if (!s) return [];
    return [
      {
        title: t("dashboard.kpi.openBugs"),
        value: s.ops.bugs_open,
        hint: s.ops.oldest_bug_age_days
          ? t("dashboard.kpi.oldestBugDays", {
              days: s.ops.oldest_bug_age_days,
            })
          : null,
        valueStyle: s.ops.bugs_open > 0 ? { color: "#d48806" } : undefined,
      },
      {
        title: t("dashboard.kpi.errors7d"),
        value: s.ops.errors_7d,
        hint: t("dashboard.kpi.errorsTotal", { total: s.ops.errors_total }),
      },
      {
        title: t("dashboard.kpi.botSessions"),
        value: (s.oauth.active_sessions_by_client || []).reduce(
          (a, r) => a + r.active_sessions,
          0
        ),
        hint: t("dashboard.kpi.botUsers", { count: s.oauth.distinct_users }),
      },
    ];
  }, [s, t]);

  return (
    <>
      <KpiGrid kpis={kpis} loading={summary.loading} skeletonCount={3} />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.oauthSessions")}
            subtitle="Source: OAuth refresh tokens · Active, unexpired"
            type="bar"
            data={oauthSessionsToBar(s?.oauth?.active_sessions_by_client)}
            options={horizontalCountOptions}
            loading={summary.loading}
            error={summary.error}
            height={260}
            empty={t("dashboard.empty.oauthSessions")}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.oauthTokens")}
            subtitle="Source: OAuth refresh tokens · Last 60 days"
            type="line"
            data={tokensToLine(oauthTokens.data)}
            options={lineOptions}
            loading={oauthTokens.loading}
            error={oauthTokens.error}
            height={260}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard
            title={t("dashboard.charts.errorsByDay")}
            subtitle="Source: Error logs · Last 30 days"
            type="bar"
            data={errorsToStacked(errorsByDay.data)}
            options={stackedCountOptions}
            loading={errorsByDay.loading}
            error={errorsByDay.error}
            height={280}
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <ChartCard
            title={t("dashboard.charts.topExceptions")}
            subtitle="Source: Error logs · Top 10 shown"
            type="bar"
            data={topToHorizontal(topExceptions.data, "Errors")}
            options={horizontalCountOptions}
            loading={topExceptions.loading}
            error={topExceptions.error}
            height={280}
          />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <ChartCard
            title={t("dashboard.charts.topErrorEndpoints")}
            subtitle="Source: Error logs · Top 10 shown"
            type="bar"
            data={topToHorizontal(topErrEndpoints.data, "Errors")}
            options={horizontalCountOptions}
            loading={topErrEndpoints.loading}
            error={topErrEndpoints.error}
            height={280}
          />
        </Col>
      </Row>
      {hygieneAlerts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {hygieneAlerts.map((a, i) => (
            <Col key={i} xs={24} md={12} lg={6}>
              <HygieneAlert title={a.title} description={a.description} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

function DashboardTabs() {
  const history = useHistory();
  const { pathname } = useLocation();
  const activeKey = pathname.split("/")[2] || "overview";
  return (
    <Tabs
      activeKey={
        DASHBOARD_SECTIONS.some((section) => section.key === activeKey)
          ? activeKey
          : "overview"
      }
      items={DASHBOARD_SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
      }))}
      onChange={(key) => history.push(`/dashboard/${key}`)}
      style={{ marginBottom: 16 }}
    />
  );
}

function AdminDashboard() {
  const { t } = useTranslation();
  const { onAuthStateChanged } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    onAuthStateChanged(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout style={{ background: "#f5f5f5", padding: 16, minHeight: "100%" }}>
      <Content>
        <Row align="middle" style={{ marginBottom: 8 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {t("dashboard.title")}
            </Title>
          </Col>
        </Row>
        <DashboardTabs />
        <Switch>
          <Route path="/dashboard" exact>
            <Redirect to="/dashboard/overview" />
          </Route>
          <Route path="/dashboard/overview" exact>
            <OverviewSection authReady={authReady} />
          </Route>
          <Route path="/dashboard/applications" exact>
            <ApplicationsSection authReady={authReady} />
          </Route>
          <Route path="/dashboard/users" exact>
            <UsersSection authReady={authReady} />
          </Route>
          <Route path="/dashboard/appointments" exact>
            <AppointmentsSection authReady={authReady} />
          </Route>
          <Route path="/dashboard/messages" exact>
            <MessagesSection authReady={authReady} />
          </Route>
          <Route path="/dashboard/ops" exact>
            <OpsSection authReady={authReady} />
          </Route>
          <Redirect to="/dashboard/overview" />
        </Switch>
      </Content>
    </Layout>
  );
}

export default AdminDashboard;
