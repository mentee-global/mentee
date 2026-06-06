import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Input,
  Popover,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MailOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { css } from "@emotion/css";
import { ACCOUNT_TYPE } from "utils/consts";
import {
  fetchAccounts,
  fetchAdminOnboarding,
  runAdminOnboardingAction,
} from "utils/api";

const { Text, Title } = Typography;

const pageClass = css`
  padding: 24px;
  background: #f7f8fa;
  min-height: 100%;

  .admin-onboarding-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .admin-onboarding-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
  }

  .admin-onboarding-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }

  .summary-tile {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
  }

  .summary-value {
    display: block;
    font-size: 22px;
    line-height: 28px;
    font-weight: 700;
    color: #111827;
  }

  .summary-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #6b7280;
    font-size: 12px;
  }

  .admin-onboarding-table {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-table-tbody > tr {
    cursor: pointer;
  }

  .help-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .help-icon {
    color: #8c8c8c;
    font-size: 13px;
  }

  .attention-type-filter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .attention-help-trigger {
    color: #8a1428;
    border-color: #d8a7b0;
    background: #ffffff;
    box-shadow: none;
  }

  .attention-help-trigger:hover,
  .attention-help-trigger:focus {
    color: #8a1428;
    border-color: #8a1428;
    background: #fff7f8;
  }
`;

const attentionPopoverClass = css`
  max-width: 300px;

  .ant-popover-inner {
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(17, 24, 39, 0.14);
  }

  .ant-popover-title {
    padding: 10px 14px 6px;
    border-bottom: 0;
    font-weight: 600;
    font-size: 13px;
  }

  .ant-popover-inner-content {
    padding: 0 14px 12px;
  }

  .attention-help-intro {
    display: block;
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .attention-help-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .attention-help-list li {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 0;
  }

  .attention-help-list li + li {
    border-top: 1px solid #f0f0f0;
  }

  .attention-help-label {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: #111827;
  }

  .attention-help-desc {
    font-size: 12px;
    line-height: 1.4;
    color: #6b7280;
  }
`;

const STAGE_OPTIONS = [
  { value: "all", label: "All stages" },
  { value: "applied", label: "Applied" },
  { value: "training", label: "Approved - in training" },
  { value: "profile", label: "Building profile" },
  { value: "active_unverified", label: "Profile created - email not verified" },
  { value: "active", label: "Active" },
  { value: "completed_no_profile", label: "Completed, no profile" },
  {
    value: "profile_without_completed_application",
    label: "Profile, app incomplete",
  },
  { value: "rejected", label: "Rejected" },
];

const STAGE_COLORS = {
  applied: "default",
  training: "blue",
  profile: "geekblue",
  active_unverified: "gold",
  active: "green",
  rejected: "red",
  completed_no_profile: "volcano",
  profile_without_completed_application: "purple",
};

const ACTIONS = {
  review_application: {
    route: null,
    navigate: "application",
    label: "Review application",
    help: "Opens the existing Applications panel filtered to this applicant. Approval stays in that workflow.",
    icon: <EyeOutlined />,
  },
  resend_training: {
    route: "resend-training",
    label: "Send training",
    help: "Sends the approved application training link. Use when the application is approved but no profile exists.",
    icon: <MailOutlined />,
  },
  resend_build_profile: {
    route: "resend-build-profile",
    label: "Send profile link",
    help: "Sends the build profile link. Use when training is complete or the person has a login but no profile.",
    icon: <MailOutlined />,
  },
  resend_verification: {
    route: "resend-verification",
    label: "Verify email",
    help: "Sends an email verification link. This does not create or edit the profile.",
    icon: <MailOutlined />,
  },
  resend_password_reset: {
    route: "resend-password-reset",
    label: "Password reset",
    help: "Sends a password reset link. This helps login problems but does not move onboarding forward.",
    icon: <MailOutlined />,
  },
  sync_verification: {
    route: "sync-verification",
    label: "Mark verified",
    help: "Marks this person as verified inside the app because their email account is already verified.",
    icon: <SyncOutlined />,
  },
  engineering_review: {
    route: null,
    label: "Engineering review",
    help: "No one-click fix is safe for this row. The records are inconsistent and need code or data review.",
    icon: null,
  },
};

const ROLE_TABS = [
  { key: String(ACCOUNT_TYPE.MENTEE), label: "Mentees" },
  { key: String(ACCOUNT_TYPE.MENTOR), label: "Mentors" },
];

const ATTENTION_RULES = [
  {
    value: "pending_review",
    label: "Pending 14+ days",
    description: "Has been waiting for review for 14 days or more.",
  },
  {
    value: "profile_not_created",
    label: "No profile after 14 days",
    description: "Approved, but still has no profile after 14 days.",
  },
  {
    value: "completed_missing_profile",
    label: "Completed, profile missing",
    description: "Marked completed, but the profile is missing.",
  },
  {
    value: "profile_app_incomplete",
    label: "Profile, app incomplete",
    description: "Has a profile, but the application is not completed.",
  },
  {
    value: "login_missing",
    label: "Login missing",
    description: "Has a profile, but no way to log in.",
  },
  {
    value: "ready_to_mark_verified",
    label: "Ready to mark verified",
    description: "Email is verified; the app just needs to catch up.",
  },
  {
    value: "email_not_verified",
    label: "Email not verified 14+ days",
    description: "Profile is 14+ days old and email is still not verified.",
  },
];

const ATTENTION_TYPE_OPTIONS = [
  { value: "all", label: "All attention types" },
  ...ATTENTION_RULES.map((rule) => ({
    value: rule.value,
    label: rule.label,
  })),
];

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function BooleanTag({ value, yes = "Yes", no = "No" }) {
  return <Tag color={value ? "green" : "default"}>{value ? yes : no}</Tag>;
}

function HelpTitle({ label, help }) {
  return (
    <span className="help-title">
      {label}
      <Tooltip title={help}>
        <InfoCircleOutlined className="help-icon" />
      </Tooltip>
    </span>
  );
}

function MetricTile({ value, label, help }) {
  return (
    <div className="summary-tile">
      <span className="summary-value">{value}</span>
      <span className="summary-label">
        {label}
        <Tooltip title={help}>
          <InfoCircleOutlined className="help-icon" />
        </Tooltip>
      </span>
    </div>
  );
}

function AttentionTypeHelp() {
  return (
    <div>
      <Text type="secondary" className="attention-help-intro">
        Only people whose onboarding looks stuck or whose records do not line
        up.
      </Text>
      <ul className="attention-help-list">
        {ATTENTION_RULES.map((rule) => (
          <li key={rule.value}>
            <span className="attention-help-label">{rule.label}</span>
            <span className="attention-help-desc">{rule.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionButton({ row, action, actionKey, onAction, size }) {
  const meta = ACTIONS[action];
  if (!meta || (!meta.route && !meta.navigate)) return null;
  return (
    <Tooltip title={meta.help}>
      <Button
        size={size}
        icon={meta.icon}
        loading={actionKey === `${row.email}:${action}`}
        onClick={(event) => {
          event.stopPropagation();
          onAction(row, action);
        }}
      >
        {meta.label}
      </Button>
    </Tooltip>
  );
}

function knownDateRows(row) {
  return [
    {
      key: "date_submitted",
      label: "Application submitted",
      value: row.date_submitted,
      help: "Stored on the application record.",
    },
    {
      key: "profile_created_at",
      label: "Profile created",
      value: row.profile_created_at,
      help: "Stored on the mentor or mentee profile record.",
    },
    {
      key: "firebase_created_at",
      label: "Login account created",
      value: row.firebase_created_at,
      help: "Date when the person received a login account.",
    },
    {
      key: "firebase_last_sign_in_at",
      label: "Last login",
      value: row.firebase_last_sign_in_at,
      help: "Most recent login we can confirm.",
    },
    {
      key: "latest_activity_at",
      label: "Latest known activity",
      value: row.latest_activity_at,
      help: "Most recent date among application, profile, login, and panel actions.",
    },
  ].filter((item) => item.value);
}

export default function AdminOnboarding() {
  const history = useHistory();
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTEE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [partnerId, setPartnerId] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(true);
  const [attentionType, setAttentionType] = useState("all");
  const [partners, setPartners] = useState([]);
  const [data, setData] = useState({ rows: [], total: 0, summary: null });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAccounts(ACCOUNT_TYPE.PARTNER, undefined, "", true, true).then(
      setPartners
    );
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminOnboarding({
        role,
        page,
        pageSize,
        search: debouncedSearch,
        partnerId,
        effectiveStage: stage,
        attention: attentionOnly,
        attentionType,
      });
      setData(result || { rows: [], total: 0, summary: null });
    } catch (err) {
      messageApi.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not load onboarding"
      );
    } finally {
      setLoading(false);
    }
  }, [
    role,
    page,
    pageSize,
    debouncedSearch,
    partnerId,
    stage,
    attentionOnly,
    attentionType,
    messageApi,
  ]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [role, debouncedSearch, stage, partnerId, attentionOnly, attentionType]);

  const runAction = async (row, action) => {
    const meta = ACTIONS[action];
    if (meta?.navigate === "application") {
      const pathname =
        row.role === ACCOUNT_TYPE.MENTOR ? "/organizer" : "/menteeOrganizer";
      const params = new URLSearchParams({ search: row.email });
      if (row.application_state) {
        params.set("application_state", row.application_state);
      }
      history.push({ pathname, search: `?${params.toString()}` });
      return;
    }
    if (!meta?.route) return;
    setActionKey(`${row.email}:${action}`);
    try {
      await runAdminOnboardingAction(row.role, row.email, meta.route);
      messageApi.success(`${meta.label} completed`);
      await loadRows();
    } catch (err) {
      messageApi.error(
        err?.response?.data?.message || err?.message || "Action failed"
      );
    } finally {
      setActionKey("");
    }
  };

  const partnerOptions = useMemo(
    () =>
      partners.map((partner) => ({
        value: partner._id?.$oid || partner.id,
        label: partner.organization || partner.person_name || partner.email,
      })),
    [partners]
  );

  const summary = data.summary || {};
  const rows = data.rows || [];
  const attentionTypeOptions = useMemo(
    () =>
      ATTENTION_TYPE_OPTIONS.map((option) => {
        if (option.value === "all") return option;
        const count = summary.attention_types?.[option.value];
        return {
          ...option,
          label: count ? `${option.label} (${count})` : option.label,
        };
      }),
    [summary.attention_types]
  );

  const columns = [
    {
      title: (
        <HelpTitle
          label="Person"
          help="Click a row or Review to open the diagnosis and available actions."
        />
      ),
      key: "person",
      width: 240,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Button
            type="link"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedRow(row);
            }}
          >
            {row.name || "No name"}
          </Button>
          <Text type="secondary">{row.email}</Text>
        </Space>
      ),
    },
    {
      title: (
        <HelpTitle
          label="Application"
          help="Raw application status from the application record, plus days since submission when available. Rows are prioritized by needs-attention first, then newer applications."
        />
      ),
      key: "application",
      width: 180,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Tag>{row.application_state || "No application"}</Tag>
          {row.days_since_submit !== null &&
            row.days_since_submit !== undefined && (
              <Text type="secondary">{row.days_since_submit} days</Text>
            )}
        </Space>
      ),
    },
    {
      title: (
        <HelpTitle
          label="Stage"
          help="Best current onboarding stage after checking the application, profile, login account, and email verification status."
        />
      ),
      dataIndex: "effective_stage_label",
      width: 230,
      render: (label, row) => (
        <Tag color={STAGE_COLORS[row.effective_stage] || "default"}>
          {label}
        </Tag>
      ),
    },
    {
      title: (
        <HelpTitle
          label="Account setup"
          help="Whether the person has a profile, can log in, has verified email, and is marked verified in the app."
        />
      ),
      key: "systems",
      width: 260,
      render: (_, row) => (
        <Space wrap size={[0, 4]}>
          <BooleanTag
            value={row.profile_exists}
            yes="Profile"
            no="No profile"
          />
          <BooleanTag
            value={row.firebase_exists}
            yes="Can log in"
            no="No login"
          />
          <BooleanTag
            value={row.firebase_verified}
            yes="Email verified"
            no="Email not verified"
          />
          <BooleanTag
            value={row.mongo_verified}
            yes="Marked verified"
            no="Needs app update"
          />
        </Space>
      ),
    },
    {
      title: (
        <HelpTitle
          label="Attention"
          help="Rows that are stuck or inconsistent. Fresh applications are not treated as issues; pending/profile steps become attention-worthy after 14 days without progress."
        />
      ),
      key: "attention",
      width: 260,
      render: (_, row) => {
        if (!row.attention_reasons?.length) {
          return <Tag color="green">Clear</Tag>;
        }
        return (
          <Tooltip
            title={row.attention_reasons
              .map((reason) => reason.message)
              .join("; ")}
          >
            <Tag color="orange">{row.attention_reasons.length} issue(s)</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: (
        <HelpTitle
          label="Last panel action"
          help="Most recent onboarding action taken from this panel, including recovery emails and marking someone verified."
        />
      ),
      key: "last_action",
      width: 180,
      render: (_, row) =>
        row.last_email_event ? (
          <Space direction="vertical" size={0}>
            <Text>
              {ACTIONS[row.last_email_event.action]?.label || "Email"}
            </Text>
            <Text type="secondary">
              {formatDate(row.last_email_event.created_at)}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">No panel action</Text>
        ),
    },
    {
      title: (
        <HelpTitle
          label="Actions"
          help="Safe recovery actions available for the current diagnosis. Hover each button for what it will do."
        />
      ),
      key: "actions",
      width: 300,
      fixed: "right",
      render: (_, row) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedRow(row);
            }}
          >
            Review
          </Button>
          {(row.available_actions || []).map((action) => {
            return (
              <ActionButton
                key={action}
                row={row}
                action={action}
                actionKey={actionKey}
                size="small"
                onAction={runAction}
              />
            );
          })}
          {row.recommended_action === "engineering_review" && (
            <Tooltip title={ACTIONS.engineering_review.help}>
              <Tag color="volcano">Engineering review</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={pageClass}>
      {contextHolder}
      <div className="admin-onboarding-header">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Onboarding
          </Title>
          <Text type="secondary">
            Diagnose incomplete mentor and mentee onboarding.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadRows} loading={loading}>
          Refresh
        </Button>
      </div>

      <Tabs
        activeKey={String(role)}
        items={ROLE_TABS}
        onChange={(key) => setRole(parseInt(key, 10))}
      />

      <div className="admin-onboarding-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 260 }}
        />
        <Select
          value={stage}
          options={STAGE_OPTIONS}
          onChange={setStage}
          style={{ width: 230 }}
        />
        <Select
          allowClear
          showSearch
          placeholder="Partner"
          optionFilterProp="label"
          value={partnerId || undefined}
          options={partnerOptions}
          onChange={(value) => setPartnerId(value || "")}
          style={{ width: 260 }}
        />
        <div className="attention-type-filter">
          <Select
            value={attentionType}
            options={attentionTypeOptions}
            onChange={(value) => {
              setAttentionType(value);
              if (value !== "all") setAttentionOnly(true);
            }}
            style={{ width: 260 }}
          />
          <Popover
            title="What each attention type means"
            content={<AttentionTypeHelp />}
            trigger="click"
            placement="bottomRight"
            overlayClassName={attentionPopoverClass}
          >
            <Button
              className="attention-help-trigger"
              shape="circle"
              size="small"
              icon={<QuestionCircleOutlined />}
              aria-label="Explain attention types"
            />
          </Popover>
        </div>
        <Button
          type={attentionOnly ? "primary" : "default"}
          icon={<CheckCircleOutlined />}
          onClick={() => {
            setAttentionOnly((value) => !value);
            if (attentionOnly) setAttentionType("all");
          }}
        >
          Needs attention
        </Button>
      </div>

      <div className="admin-onboarding-summary">
        <MetricTile
          value={summary.total ?? data.total ?? 0}
          label="People in view"
          help="Everyone in this tab matching the current search, partner, and stage. The Needs attention toggle only filters the table below, not this total."
        />
        <MetricTile
          value={summary.needs_attention || 0}
          label="Need attention"
          help="How many of the people in view are stale or inconsistent. A new application is not counted just because it has not progressed yet."
        />
        <MetricTile
          value={summary.actions?.sync_verification || 0}
          label="Ready to mark verified"
          help="Rows where the email is already verified, but the app still needs to be updated."
        />
        <MetricTile
          value={
            (summary.actions?.resend_training || 0) +
            (summary.actions?.resend_build_profile || 0)
          }
          label="Recovery links"
          help="Rows where the likely next step is resending a training or build-profile link."
        />
      </div>

      {attentionOnly && rows.length === 0 && !loading && (
        <Alert
          type="success"
          showIcon
          message="No onboarding issues match the current filters."
          style={{ marginBottom: 14 }}
        />
      )}

      <div className="admin-onboarding-table">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1550 }}
          onRow={(row) => ({
            onClick: () => setSelectedRow(row),
          })}
          pagination={{
            current: data.page || page,
            pageSize: data.page_size || pageSize,
            total: data.total || 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </div>

      <Drawer
        title={
          selectedRow?.name || selectedRow?.email || "Onboarding diagnosis"
        }
        open={Boolean(selectedRow)}
        width={620}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text strong>Recommended action</Text>
              <div style={{ marginTop: 8 }}>
                {selectedRow.recommended_action ? (
                  <Tooltip
                    title={ACTIONS[selectedRow.recommended_action]?.help}
                  >
                    <Tag
                      color={
                        selectedRow.recommended_action === "engineering_review"
                          ? "volcano"
                          : "blue"
                      }
                    >
                      {ACTIONS[selectedRow.recommended_action]?.label}
                    </Tag>
                  </Tooltip>
                ) : (
                  <Tag color="green">No recovery action needed</Tag>
                )}
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Email">
                {selectedRow.email}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {selectedRow.role_label}
              </Descriptions.Item>
              <Descriptions.Item label="Stage">
                {selectedRow.effective_stage_label}
              </Descriptions.Item>
              <Descriptions.Item label="Application state">
                {selectedRow.application_state || "No application"}
              </Descriptions.Item>
              <Descriptions.Item label="Organization">
                {selectedRow.organization || "None"}
              </Descriptions.Item>
              <Descriptions.Item label="Last panel action">
                {selectedRow.last_email_event
                  ? `${
                      ACTIONS[selectedRow.last_email_event.action]?.label ||
                      "Action"
                    } - ${formatDate(selectedRow.last_email_event.created_at)}`
                  : "No panel action"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <Space align="center" size={6}>
                <Text strong>Known dates</Text>
                <Tooltip title="Only dates stored by the application, profile, login system, or this admin panel are shown. Training clicks and unfinished profile attempts are not currently tracked.">
                  <InfoCircleOutlined className="help-icon" />
                </Tooltip>
              </Space>
              <div style={{ marginTop: 8 }}>
                {knownDateRows(selectedRow).length ? (
                  <Descriptions column={1} size="small" bordered>
                    {knownDateRows(selectedRow).map((item) => (
                      <Descriptions.Item
                        key={item.key}
                        label={
                          <Space size={6}>
                            {item.label}
                            <Tooltip title={item.help}>
                              <InfoCircleOutlined className="help-icon" />
                            </Tooltip>
                          </Space>
                        }
                      >
                        {formatDate(item.value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                ) : (
                  <Text type="secondary">
                    No reliable dates are stored yet.
                  </Text>
                )}
              </div>
            </div>

            <div>
              <Space align="center" size={6}>
                <Text strong>Panel action history</Text>
                <Tooltip title="These are actions taken from this onboarding panel. Recovery emails and marking someone verified are stored here.">
                  <InfoCircleOutlined className="help-icon" />
                </Tooltip>
              </Space>
              <div style={{ marginTop: 8 }}>
                {selectedRow.action_events?.length ? (
                  <Space direction="vertical" size={8}>
                    {selectedRow.action_events.map((event) => (
                      <Space key={`${event.action}-${event.created_at}`} wrap>
                        <Tag color={event.success ? "green" : "red"}>
                          {event.success ? "Done" : "Failed"}
                        </Tag>
                        <Text>
                          {ACTIONS[event.action]?.label || event.action}
                        </Text>
                        <Text type="secondary">
                          {formatDate(event.created_at)}
                        </Text>
                        {event.admin_email && (
                          <Text type="secondary">by {event.admin_email}</Text>
                        )}
                        {!event.success && event.error_message && (
                          <Tooltip title={event.error_message}>
                            <Tag color="red">Error</Tag>
                          </Tooltip>
                        )}
                      </Space>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">
                    No actions have been sent from this panel yet.
                  </Text>
                )}
              </div>
            </div>

            <Space wrap>
              <BooleanTag
                value={selectedRow.application_exists}
                yes="Application"
                no="No application"
              />
              <BooleanTag
                value={selectedRow.profile_exists}
                yes="Profile"
                no="No profile"
              />
              <BooleanTag
                value={selectedRow.firebase_exists}
                yes="Can log in"
                no="No login"
              />
              <BooleanTag
                value={selectedRow.firebase_verified}
                yes="Email verified"
                no="Email not verified"
              />
              <BooleanTag
                value={selectedRow.mongo_verified}
                yes="Marked verified"
                no="Needs app update"
              />
            </Space>

            <div>
              <Text strong>Attention</Text>
              <div style={{ marginTop: 8 }}>
                {selectedRow.attention_reasons?.length ? (
                  <Space direction="vertical" size={6}>
                    {selectedRow.attention_reasons.map((reason) => (
                      <Tag color="orange" key={reason.code}>
                        {reason.message}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Tag color="green">Clear</Tag>
                )}
              </div>
            </div>

            <Space wrap>
              {(selectedRow.available_actions || []).map((action) => {
                return (
                  <ActionButton
                    key={action}
                    row={selectedRow}
                    action={action}
                    actionKey={actionKey}
                    onAction={runAction}
                  />
                );
              })}
              {selectedRow.recommended_action === "engineering_review" && (
                <Tooltip title={ACTIONS.engineering_review.help}>
                  <Tag color="volcano">Engineering review</Tag>
                </Tooltip>
              )}
            </Space>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
