import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  MailOutlined,
  StopOutlined,
} from "@ant-design/icons";
import moment from "moment";

import {
  fetchMessageFlagById,
  fetchMessageFlags,
  updateMessageFlagAction,
} from "utils/api";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const oid = (value) => value?.$oid || value;
const dateValue = (value) => value?.$date || value;

const severityColor = {
  high: "red",
  medium: "orange",
  low: "blue",
};

const statusColor = {
  pending: "gold",
  allowed: "green",
  dismissed: "default",
  hidden: "volcano",
  deleted: "red",
};

const sourceLabel = {
  direct: "Direct",
  group: "Hub group",
  partner_group: "Partner group",
};

function formatDate(value) {
  const raw = dateValue(value);
  return raw ? moment(raw).format("MMM D, YYYY h:mm A") : "";
}

function compactId(value) {
  const id = oid(value);
  return id ? `${id.slice(0, 6)}...${id.slice(-4)}` : "";
}

function AdminMessageFlags() {
  const [filters, setFilters] = useState({
    status: "pending",
    severity: "all",
    source_type: "all",
    origin: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const loadFlags = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    const result = await fetchMessageFlags(nextFilters);
    setData({
      items: Array.isArray(result?.items) ? result.items : [],
      total: result?.total || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => {
    const next = { ...filters, [key]: value, page: 1 };
    setFilters(next);
    loadFlags(next);
  };

  const openDetail = async (flag) => {
    setDetailLoading(true);
    setNote("");
    const result = await fetchMessageFlagById(oid(flag._id));
    setDetail(result);
    setDetailLoading(false);
  };

  const runAction = async (action) => {
    if (!detail?.flag?._id) return;
    setActionLoading(true);
    const result = await updateMessageFlagAction(
      oid(detail.flag._id),
      action,
      note
    );
    setActionLoading(false);
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    message.success("Message flag updated");
    setDetail(null);
    loadFlags();
  };

  const columns = useMemo(
    () => [
      {
        title: "Severity",
        dataIndex: "severity",
        width: 110,
        render: (value) => <Tag color={severityColor[value]}>{value}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 120,
        render: (value) => <Tag color={statusColor[value]}>{value}</Tag>,
      },
      {
        title: "Type",
        dataIndex: "source_type",
        width: 140,
        render: (value) => sourceLabel[value] || value,
      },
      {
        title: "Sender",
        dataIndex: "sender",
        width: 220,
        render: (sender, row) => (
          <div>
            <Text strong>{sender?.name || compactId(row.sender_id)}</Text>
            {sender?.email && <div className="muted-text">{sender.email}</div>}
          </div>
        ),
      },
      {
        title: "Message",
        dataIndex: "body",
        ellipsis: true,
      },
      {
        title: "Reason",
        dataIndex: "reason",
        ellipsis: true,
      },
      {
        title: "Created",
        dataIndex: "created_at",
        width: 180,
        render: formatDate,
      },
      {
        title: "",
        width: 90,
        render: (_, row) => (
          <Button icon={<EyeOutlined />} onClick={() => openDetail(row)}>
            View
          </Button>
        ),
      },
    ],
    []
  );

  const contextMessages = Array.isArray(detail?.context) ? detail.context : [];
  const selectedFlag = detail?.flag;

  return (
    <div style={{ padding: 16 }}>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Flagged Messages
          </Title>
        </Col>
        <Col>
          <Button onClick={() => loadFlags()} loading={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={5}>
          <Select
            value={filters.status}
            onChange={(value) => setFilter("status", value)}
            style={{ width: "100%" }}
            options={[
              { value: "pending", label: "Pending" },
              { value: "all", label: "All statuses" },
              { value: "allowed", label: "Allowed" },
              { value: "dismissed", label: "Dismissed" },
              { value: "hidden", label: "Hidden" },
              { value: "deleted", label: "Deleted" },
            ]}
          />
        </Col>
        <Col xs={24} md={5}>
          <Select
            value={filters.severity}
            onChange={(value) => setFilter("severity", value)}
            style={{ width: "100%" }}
            options={[
              { value: "all", label: "All severities" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
        </Col>
        <Col xs={24} md={5}>
          <Select
            value={filters.source_type}
            onChange={(value) => setFilter("source_type", value)}
            style={{ width: "100%" }}
            options={[
              { value: "all", label: "All message types" },
              { value: "direct", label: "Direct" },
              { value: "group", label: "Hub group" },
              { value: "partner_group", label: "Partner group" },
            ]}
          />
        </Col>
        <Col xs={24} md={5}>
          <Select
            value={filters.origin}
            onChange={(value) => setFilter("origin", value)}
            style={{ width: "100%" }}
            options={[
              { value: "all", label: "Live + backfill" },
              { value: "live", label: "Live" },
              { value: "backfill", label: "Backfill" },
            ]}
          />
        </Col>
        <Col xs={24} md={4}>
          <Input.Search
            placeholder="Search"
            allowClear
            onSearch={(value) => setFilter("search", value)}
          />
        </Col>
        <Col xs={24}>
          <RangePicker
            onChange={(dates) => {
              const next = {
                ...filters,
                page: 1,
                since: dates?.[0]?.toISOString(),
                before: dates?.[1]?.toISOString(),
              };
              setFilters(next);
              loadFlags(next);
            }}
          />
        </Col>
      </Row>

      <Table
        rowKey={(row) => oid(row._id)}
        columns={columns}
        dataSource={data.items}
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total: data.total,
          onChange: (page, pageSize) => {
            const next = { ...filters, page, limit: pageSize };
            setFilters(next);
            loadFlags(next);
          },
        }}
      />

      <Modal
        open={Boolean(detail)}
        title="Flagged Message"
        onCancel={() => setDetail(null)}
        width={900}
        footer={null}
      >
        {detailLoading || !selectedFlag ? (
          <Table loading pagination={false} columns={[]} dataSource={[]} />
        ) : (
          <>
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag color={severityColor[selectedFlag.severity]}>
                {selectedFlag.severity}
              </Tag>
              <Tag color={statusColor[selectedFlag.status]}>
                {selectedFlag.status}
              </Tag>
              <Tag>{sourceLabel[selectedFlag.source_type]}</Tag>
              <Tag>{selectedFlag.origin}</Tag>
            </Space>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Sender: </Text>
              <Text>
                {selectedFlag.sender?.name || compactId(selectedFlag.sender_id)}
                {selectedFlag.sender?.email
                  ? ` (${selectedFlag.sender.email})`
                  : ""}
              </Text>
            </div>
            {selectedFlag.title && (
              <div style={{ marginBottom: 12 }}>
                <Text strong>Title: </Text>
                <Text>{selectedFlag.title}</Text>
              </div>
            )}
            <Alert
              type="warning"
              message={selectedFlag.reason}
              description={
                selectedFlag.categories?.length
                  ? `Categories: ${selectedFlag.categories.join(", ")}`
                  : undefined
              }
              style={{ marginBottom: 16 }}
            />
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
                whiteSpace: "pre-wrap",
              }}
            >
              {selectedFlag.body}
            </div>
            <Input.TextArea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Admin note"
              style={{ marginBottom: 16 }}
            />
            <Space wrap style={{ marginBottom: 20 }}>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={actionLoading}
                onClick={() => runAction("allow")}
                disabled={selectedFlag.status !== "pending"}
              >
                Allow
              </Button>
              <Button
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={() => runAction("dismiss")}
                disabled={selectedFlag.status !== "pending"}
              >
                Dismiss
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={actionLoading}
                onClick={() => runAction("hide")}
                disabled={selectedFlag.status !== "pending"}
              >
                Hide/Delete
              </Button>
              <Button
                icon={<MailOutlined />}
                loading={actionLoading}
                onClick={() => runAction("warn")}
              >
                Send Warning
              </Button>
            </Space>
            <Title level={5}>Conversation Context</Title>
            <Table
              size="small"
              pagination={false}
              rowKey={(row, index) => oid(row._id) || index}
              dataSource={contextMessages}
              columns={[
                {
                  title: "Sender",
                  dataIndex: "sender_id",
                  width: 170,
                  render: compactId,
                },
                {
                  title: "Message",
                  dataIndex: "body",
                  ellipsis: true,
                  render: (value, row) => value || row.title,
                },
                {
                  title: "Created",
                  dataIndex: "created_at",
                  width: 180,
                  render: formatDate,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}

export default AdminMessageFlags;
