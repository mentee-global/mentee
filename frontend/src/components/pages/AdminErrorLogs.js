import React, { useState, useEffect } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchErrorLogs,
  fetchErrorLogById,
  fetchErrorAlertRecipients,
  setErrorAlertRecipients,
  deleteErrorLog,
} from "utils/api";
import { useAuth } from "utils/hooks/useAuth";

const { Paragraph, Text } = Typography;

const SEVERITY_COLORS = { error: "red", warning: "orange" };
const SOURCE_COLORS = { backend: "geekblue", frontend: "purple" };

const formatTs = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (_) {
    return iso;
  }
};

function AdminErrorLogs() {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);
  const [severity, setSeverity] = useState();
  const [source, setSource] = useState();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [recipientIds, setRecipientIds] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [savingRecipients, setSavingRecipients] = useState(false);
  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { limit: 200 };
        if (severity) params.severity = severity;
        if (source) params.source = source;
        const data = await fetchErrorLogs(params);
        setItems(data?.items || []);
      } catch (e) {
        message.error("Failed to load error logs");
        console.error(e);
      }
      setLoading(false);
    }
    onAuthStateChanged(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, severity, source]);

  useEffect(() => {
    async function loadRecipients() {
      setRecipientsLoading(true);
      try {
        const admins = await fetchErrorAlertRecipients();
        const sorted = [...admins].sort((a, b) =>
          (a.name || a.email || "").localeCompare(b.name || b.email || "")
        );
        setAdminList(sorted);
        setRecipientIds(
          sorted.filter((a) => a.receive_error_alerts).map((a) => a.id)
        );
      } catch (e) {
        console.error(e);
      }
      setRecipientsLoading(false);
    }
    onAuthStateChanged(loadRecipients);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRecipients = async () => {
    setSavingRecipients(true);
    const res = await setErrorAlertRecipients(recipientIds);
    if (res?.ok) {
      message.success("Alert recipients saved");
      setAdminList((prev) =>
        prev.map((a) => ({
          ...a,
          receive_error_alerts: recipientIds.includes(a.id),
        }))
      );
    } else {
      message.error(res?.error || "Failed to save recipients");
    }
    setSavingRecipients(false);
  };

  useEffect(() => {
    if (!search) {
      setFiltered(items);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      items.filter(
        (x) =>
          (x.endpoint || "").toLowerCase().includes(q) ||
          (x.exception_type || "").toLowerCase().includes(q) ||
          (x.exception_message || "").toLowerCase().includes(q) ||
          (x.user_email || "").toLowerCase().includes(q)
      )
    );
  }, [items, search]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const log = await fetchErrorLogById(id);
      setDetail(log);
    } catch (e) {
      message.error("Failed to load error detail");
    }
    setDetailLoading(false);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    setDeletingId(id);
    const res = await deleteErrorLog(id);
    if (res?.ok) {
      message.success("Error log deleted");
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (detail && detail.id === id) {
        setDetail(null);
      }
    } else {
      message.error(res?.error || "Failed to delete error log");
    }
    setDeletingId(null);
  };

  const columns = [
    {
      title: "When",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 170,
      render: formatTs,
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      render: (v) => <Tag color={SEVERITY_COLORS[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 100,
      render: (v) => <Tag color={SOURCE_COLORS[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      width: 260,
      ellipsis: true,
    },
    {
      title: "Exception",
      dataIndex: "exception_type",
      key: "exception_type",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Message",
      dataIndex: "exception_message",
      key: "exception_message",
      ellipsis: true,
    },
    {
      title: "User",
      dataIndex: "user_email",
      key: "user_email",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Notified",
      dataIndex: "notified",
      key: "notified",
      width: 90,
      render: (v) =>
        v ? (
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        ) : (
          <CloseCircleTwoTone twoToneColor="#d9d9d9" />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      fixed: "right",
      render: (_, record) => (
        <Popconfirm
          title="Delete this error log?"
          description="This action cannot be undone."
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onConfirm={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            handleDelete(record.id);
          }}
          onCancel={(e) => {
            if (e && e.stopPropagation) e.stopPropagation();
          }}
        >
          <Button
            danger
            size="small"
            type="text"
            icon={<DeleteOutlined />}
            loading={deletingId === record.id}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="account-data-body" style={{ padding: 24 }}>
      <Breadcrumb>
        <Breadcrumb.Item>Admin</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="/admin/error-logs">Error Logs</a>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card
        size="small"
        title="Email alert recipients"
        style={{ marginTop: 20, marginBottom: 12 }}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={savingRecipients}
            onClick={saveRecipients}
          >
            Save
          </Button>
        }
      >
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Selected admins receive an email when an unexpected error occurs.
          Rate-limited to one alert per exception per 30 minutes.
        </Paragraph>
        <Select
          mode="multiple"
          showSearch
          allowClear
          placeholder="Search admins by name or email"
          loading={recipientsLoading}
          value={recipientIds}
          onChange={setRecipientIds}
          style={{ width: "100%" }}
          optionFilterProp="label"
          options={adminList.map((a) => ({
            value: a.id,
            label: `${a.name || "(no name)"} <${a.email}>`,
          }))}
        />
      </Card>

      <div style={{ marginTop: 20, marginBottom: 12 }}>
        <Space size="middle" wrap>
          <Input.Search
            placeholder="Search endpoint / exception / message / user"
            prefix={<SearchOutlined />}
            allowClear
            onSearch={setSearch}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 360 }}
          />
          <Select
            placeholder="Severity"
            allowClear
            style={{ width: 140 }}
            value={severity}
            onChange={setSeverity}
            options={[
              { value: "error", label: "Error" },
              { value: "warning", label: "Warning" },
            ]}
          />
          <Select
            placeholder="Source"
            allowClear
            style={{ width: 140 }}
            value={source}
            onChange={setSource}
            options={[
              { value: "backend", label: "Backend" },
              { value: "frontend", label: "Frontend" },
            ]}
          />
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => setReload((r) => !r)}
          >
            Refresh
          </Button>
          <Text type="secondary">{filtered.length} shown</Text>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filtered.map((it) => ({ ...it, key: it.id }))}
          pagination={{ pageSize: 25 }}
          scroll={{ x: 1400 }}
          onRow={(record) => ({
            onClick: () => openDetail(record.id),
            style: { cursor: "pointer" },
          })}
        />
      </Spin>

      <Drawer
        title={detail ? detail.exception_type : "Error detail"}
        width={720}
        open={!!detail || detailLoading}
        onClose={() => setDetail(null)}
        destroyOnHidden
        extra={
          detail ? (
            <Popconfirm
              title="Delete this error log?"
              description="This action cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              onConfirm={() => handleDelete(detail.id)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === detail.id}
              >
                Delete
              </Button>
            </Popconfirm>
          ) : null
        }
      >
        <Spin spinning={detailLoading}>
          {detail && (
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text strong>When: </Text>
                <Text>{formatTs(detail.timestamp)}</Text>
              </div>
              <div>
                <Text strong>Severity / Source: </Text>
                <Tag color={SEVERITY_COLORS[detail.severity] || "default"}>
                  {detail.severity}
                </Tag>
                <Tag color={SOURCE_COLORS[detail.source] || "default"}>
                  {detail.source}
                </Tag>
                {detail.notified ? (
                  <Tag color="green">Dev notified</Tag>
                ) : (
                  <Tag>No dev notified</Tag>
                )}
              </div>
              <div>
                <Text strong>Endpoint: </Text>
                <Text code>{detail.endpoint || "(unknown)"}</Text>
              </div>
              <div>
                <Text strong>User: </Text>
                <Text>{detail.user_email || "(none)"}</Text>
                {detail.user_role ? (
                  <Text type="secondary"> · role {detail.user_role}</Text>
                ) : null}
              </div>
              {detail.user_agent ? (
                <div>
                  <Text strong>User-Agent: </Text>
                  <Text type="secondary">{detail.user_agent}</Text>
                </div>
              ) : null}
              {detail.ip ? (
                <div>
                  <Text strong>IP: </Text>
                  <Text>{detail.ip}</Text>
                </div>
              ) : null}
              <div>
                <Text strong>Message</Text>
                <Paragraph copyable style={{ whiteSpace: "pre-wrap" }}>
                  {detail.exception_message || ""}
                </Paragraph>
              </div>
              {detail.traceback ? (
                <div>
                  <Text strong>Traceback</Text>
                  <pre
                    style={{
                      background: "#f6f8fa",
                      padding: 12,
                      borderRadius: 4,
                      maxHeight: 360,
                      overflow: "auto",
                      fontSize: 12,
                    }}
                  >
                    {detail.traceback}
                  </pre>
                </div>
              ) : null}
              {detail.request_payload ? (
                <div>
                  <Text strong>Request payload (sanitized)</Text>
                  <pre
                    style={{
                      background: "#f6f8fa",
                      padding: 12,
                      borderRadius: 4,
                      maxHeight: 240,
                      overflow: "auto",
                      fontSize: 12,
                    }}
                  >
                    {detail.request_payload}
                  </pre>
                </div>
              ) : null}
            </Space>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}

export default AdminErrorLogs;
