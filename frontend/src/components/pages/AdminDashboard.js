import React, { useEffect, useMemo, useState } from "react";
import { Col, Layout, Row, Typography } from "antd";
import { useTranslation } from "react-i18next";

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
  return {
    labels: items.map((i) => String(i[labelKey] ?? "")),
    datasets: [
      {
        label,
        data: items.map((i) => i[valueKey] || 0),
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

// ---------- the page ------------------------------------------------------

function AdminDashboard() {
  const { t } = useTranslation();
  const { onAuthStateChanged } = useAuth();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    onAuthStateChanged(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useApi(fetchDashboardSummary, authReady);

  const menteeFunnel = useApi(
    () => fetchDashboardApplicationsByMonth("mentee"),
    authReady
  );
  const mentorFunnel = useApi(
    () => fetchDashboardApplicationsByMonth("mentor"),
    authReady
  );
  const apptsByMonth = useApi(
    () => fetchDashboardAppointmentsByMonth(12),
    authReady
  );
  const topMentors = useApi(() => fetchDashboardTopMentors(10), authReady);
  const acceptance = useApi(
    () => fetchDashboardAcceptanceRates(3, 20),
    authReady
  );
  const messages = useApi(() => fetchDashboardMessagesByDay(90), authReady);

  const countries = useApi(() => fetchDashboardCountries(15), authReady);
  const topics = useApi(() => fetchDashboardTopics(15), authReady);
  const crisis = useApi(() => fetchDashboardCrisisStatus(10), authReady);

  const mentorSpecs = useApi(
    () => fetchDashboardMentorSpecializations(15),
    authReady
  );
  const menteeIdentify = useApi(
    () => fetchDashboardIdentify("mentee"),
    authReady
  );
  const mentorFlags = useApi(fetchDashboardMentorFlags, authReady);

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
  const partnersMentee = useApi(
    () => fetchDashboardTopPartners("mentee", 10),
    authReady
  );
  const partnersMentor = useApi(
    () => fetchDashboardTopPartners("mentor", 10),
    authReady
  );

  // -------- derived numbers from summary --------
  const s = summary.data;

  const kpis = useMemo(() => {
    if (!s) return [];
    const menteeFunnelCounts = s.funnel?.mentee || {};
    const mentorFunnelCounts = s.funnel?.mentor || {};
    const menteeTotal = Object.values(menteeFunnelCounts).reduce(
      (a, b) => a + b,
      0
    );
    const mentorTotal = Object.values(mentorFunnelCounts).reduce(
      (a, b) => a + b,
      0
    );
    const mentorApproved = mentorFunnelCounts.APPROVED || 0;
    const mentorBuildProfile = mentorFunnelCounts.BuildProfile || 0;
    const buildProfileDropoff = pct(
      mentorBuildProfile,
      mentorApproved + mentorBuildProfile
    );

    return [
      {
        title: t("dashboard.kpi.totalUsers"),
        value: s.users.total,
      },
      {
        title: t("dashboard.kpi.mentees"),
        value: s.users.profile_counts.mentee_profile,
        hint: `${s.users.profile_counts.mentor_profile} mentors`,
      },
      {
        title: t("dashboard.kpi.menteeApproval"),
        value: pct(menteeFunnelCounts.APPROVED || 0, menteeTotal),
        suffix: "%",
      },
      {
        title: t("dashboard.kpi.mentorDropoff"),
        value: buildProfileDropoff,
        suffix: "%",
        valueStyle: buildProfileDropoff > 30 ? { color: "#cf1322" } : undefined,
        hint: t("dashboard.kpi.mentorDropoffHint"),
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

  const hygiene = s?.hygiene;

  const hygieneAlerts = useMemo(() => {
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
  }, [hygiene, t]);

  const oauthSessionsData = oauthSessionsToBar(
    s?.oauth?.active_sessions_by_client
  );
  const apptsStatusData = appointmentsToDoughnut(s?.appointments);
  const rolesData = rolesToDoughnut(s?.users?.by_role);

  return (
    <Layout style={{ background: "#f5f5f5", padding: 16, minHeight: "100%" }}>
      <Content>
        {/* Header */}
        <Row align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {t("dashboard.title")}
            </Title>
          </Col>
        </Row>

        {/* KPI strip */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {kpis.length === 0
            ? Array.from({ length: 7 }).map((_, i) => (
                <Col key={i} xs={12} sm={8} md={6} lg={3}>
                  <KpiTile loading title="…" />
                </Col>
              ))
            : kpis.map((k, i) => (
                <Col key={i} xs={12} sm={8} md={6} lg={3}>
                  <KpiTile {...k} loading={summary.loading} />
                </Col>
              ))}
        </Row>

        {/* Audience */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.roles")}
              type="doughnut"
              data={rolesData}
              options={doughnutOptions}
              loading={summary.loading}
              error={summary.error}
              height={260}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.oauthSessions")}
              type="bar"
              data={oauthSessionsData}
              options={horizontalBarOptions}
              loading={summary.loading}
              error={summary.error}
              height={260}
              empty={t("dashboard.empty.oauthSessions")}
            />
          </Col>
        </Row>

        {/* Funnels */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.menteeFunnel")}
              type="bar"
              data={funnelToStacked(menteeFunnel.data)}
              options={stackedBarOptions}
              loading={menteeFunnel.loading}
              error={menteeFunnel.error}
              height={300}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.mentorFunnel")}
              type="bar"
              data={funnelToStacked(mentorFunnel.data)}
              options={stackedBarOptions}
              loading={mentorFunnel.loading}
              error={mentorFunnel.error}
              height={300}
            />
          </Col>
        </Row>

        {/* Geography & demand */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.countries")}
              type="bar"
              data={topToHorizontal(countries.data, "Applicants")}
              options={horizontalBarOptions}
              loading={countries.loading}
              error={countries.error}
              height={320}
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.topics")}
              type="bar"
              data={topToHorizontal(topics.data, "Requests")}
              options={horizontalBarOptions}
              loading={topics.loading}
              error={topics.error}
              height={320}
            />
          </Col>
          <Col xs={24} md={24} lg={8}>
            <ChartCard
              title={t("dashboard.charts.crisis")}
              type="bar"
              data={topToHorizontal(crisis.data, "Mentees")}
              options={horizontalBarOptions}
              loading={crisis.loading}
              error={crisis.error}
              height={320}
            />
          </Col>
        </Row>

        {/* Mentor side */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.mentorSpecs")}
              type="bar"
              data={topToHorizontal(mentorSpecs.data, "Mentors")}
              options={horizontalBarOptions}
              loading={mentorSpecs.loading}
              error={mentorSpecs.error}
              height={320}
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.menteeIdentify")}
              type="doughnut"
              data={(() => {
                const data = menteeIdentify.data;
                if (!data || !data.length) return null;
                return {
                  labels: data.map((r) => r.value),
                  datasets: [
                    {
                      data: data.map((r) => r.count),
                      backgroundColor: data.map((r, i) => colorFor(r.value, i)),
                      borderWidth: 0,
                    },
                  ],
                };
              })()}
              options={doughnutOptions}
              loading={menteeIdentify.loading}
              error={menteeIdentify.error}
              height={320}
            />
          </Col>
          <Col xs={24} md={24} lg={8}>
            <ChartCard
              title={t("dashboard.charts.mentorFlags")}
              type="bar"
              data={flagsToBar(mentorFlags.data)}
              options={horizontalBarOptions}
              loading={mentorFlags.loading}
              error={mentorFlags.error}
              height={320}
            />
          </Col>
        </Row>

        {/* Sessions */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.apptStatus")}
              type="doughnut"
              data={apptsStatusData}
              options={doughnutOptions}
              loading={summary.loading}
              error={summary.error}
              height={300}
            />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <ChartCard
              title={t("dashboard.charts.topMentors")}
              type="bar"
              data={topToHorizontal(
                topMentors.data?.map((m) => ({
                  value: m.mentor_name || `${(m.mentor_id || "").slice(0, 8)}…`,
                  count: m.appointments,
                })),
                "Sessions"
              )}
              options={horizontalBarOptions}
              loading={topMentors.loading}
              error={topMentors.error}
              height={300}
            />
          </Col>
          <Col xs={24} md={24} lg={8}>
            <ChartCard
              title={t("dashboard.charts.acceptanceRates")}
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

        {/* Appointments over time */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24}>
            <ChartCard
              title={t("dashboard.charts.apptsByMonth")}
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
              options={stackedBarOptions}
              loading={apptsByMonth.loading}
              error={apptsByMonth.error}
              height={260}
            />
          </Col>
        </Row>

        {/* Engagement (DMs) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24}>
            <ChartCard
              title={t("dashboard.charts.messagesByDay")}
              type="line"
              data={messagesToLine(messages.data)}
              options={lineOptions}
              loading={messages.loading}
              error={messages.error}
              height={280}
            />
          </Col>
        </Row>

        {/* Ops health */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.errorsByDay")}
              type="bar"
              data={errorsToStacked(errorsByDay.data)}
              options={stackedBarOptions}
              loading={errorsByDay.loading}
              error={errorsByDay.error}
              height={280}
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <ChartCard
              title={t("dashboard.charts.topExceptions")}
              type="bar"
              data={topToHorizontal(topExceptions.data, "Errors")}
              options={horizontalBarOptions}
              loading={topExceptions.loading}
              error={topExceptions.error}
              height={280}
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <ChartCard
              title={t("dashboard.charts.topErrorEndpoints")}
              type="bar"
              data={topToHorizontal(topErrEndpoints.data, "Errors")}
              options={horizontalBarOptions}
              loading={topErrEndpoints.loading}
              error={topErrEndpoints.error}
              height={280}
            />
          </Col>
        </Row>

        {/* OAuth */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24}>
            <ChartCard
              title={t("dashboard.charts.oauthTokens")}
              type="line"
              data={tokensToLine(oauthTokens.data)}
              options={lineOptions}
              loading={oauthTokens.loading}
              error={oauthTokens.error}
              height={260}
            />
          </Col>
        </Row>

        {/* Partners */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.topPartnersMentee")}
              type="bar"
              data={partnersToBar(partnersMentee.data)}
              options={horizontalBarOptions}
              loading={partnersMentee.loading}
              error={partnersMentee.error}
              height={300}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard
              title={t("dashboard.charts.topPartnersMentor")}
              type="bar"
              data={partnersToBar(partnersMentor.data)}
              options={horizontalBarOptions}
              loading={partnersMentor.loading}
              error={partnersMentor.error}
              height={300}
            />
          </Col>
        </Row>

        {/* Hygiene strip */}
        {hygieneAlerts.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {hygieneAlerts.map((a, i) => (
              <Col key={i} xs={24} md={12} lg={6}>
                <HygieneAlert title={a.title} description={a.description} />
              </Col>
            ))}
          </Row>
        )}
      </Content>
    </Layout>
  );
}

export default AdminDashboard;
