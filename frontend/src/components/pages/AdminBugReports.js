import React, { useState, useEffect } from "react";
import {
  Button,
  Breadcrumb,
  Input,
  Spin,
  Table,
  Tag,
  Modal,
  Select,
  message,
  Space,
  Image,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  fetchBugReports,
  deleteBugReportById,
  updateBugReport,
} from "../../utils/api";
import { formatDateTime } from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";
import "../css/AdminAccountData.scss";

const { TextArea } = Input;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "red" },
  { value: "in_progress", label: "In Progress", color: "blue" },
  { value: "resolved", label: "Resolved", color: "green" },
  { value: "closed", label: "Closed", color: "default" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "orange" },
  { value: "high", label: "High", color: "red" },
  { value: "critical", label: "Critical", color: "purple" },
];

function AdminBugReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [reload, setReload] = useState(true);
  const [bugReports, setBugReports] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedBug, setSelectedBug] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    async function getData() {
      setIsLoading(true);
      try {
        const data = await fetchBugReports({ limit: 500 });
        if (data) {
          // Add key for table
          const dataWithKeys = data.map((item) => ({
            ...item,
            key: item._id.$oid,
          }));
          setBugReports(dataWithKeys);
          setFilteredData(dataWithKeys);
        }
      } catch (error) {
        message.error("Failed to load bug reports");
        console.error(error);
      }
      setIsLoading(false);
    }
    // Wait for auth before fetching data
    onAuthStateChanged(getData);
  }, [reload]);

  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(bugReports);
      return;
    }
    const searchLower = value.toLowerCase();
    const filtered = bugReports.filter(
      (bug) =>
        bug._id.$oid?.toLowerCase().includes(searchLower) ||
        bug.user_name?.toLowerCase().includes(searchLower) ||
        bug.user_email?.toLowerCase().includes(searchLower) ||
        bug.description?.toLowerCase().includes(searchLower)
    );
    setFilteredData(filtered);
  };

  const handleFilterByStatus = (status) => {
    if (!status || status === "all") {
      setFilteredData(bugReports);
      return;
    }
    const filtered = bugReports.filter((bug) => bug.status === status);
    setFilteredData(filtered);
  };

  const handleViewDetails = (bug) => {
    setSelectedBug(bug);
    setDetailModalVisible(true);
  };

  const handleEdit = (bug) => {
    setSelectedBug(bug);
    setEditForm({
      status: bug.status,
      priority: bug.priority,
      notes: bug.notes || "",
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateBugReport(selectedBug._id.$oid, editForm);
      message.success("Bug report updated successfully");
      setEditModalVisible(false);
      setReload(!reload);
    } catch (error) {
      message.error("Failed to update bug report");
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this bug report?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteBugReportById(id);
          message.success("Bug report deleted successfully");
          setReload(!reload);
        } catch (error) {
          message.error("Failed to delete bug report");
        }
      },
    });
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "id",
      width: 100,
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontSize: "11px" }}>
          {id.$oid.slice(-8)}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date_submitted",
      key: "date_submitted",
      width: 150,
      render: (date) => <span>{formatDateTime(new Date(date.$date))}</span>,
      sorter: (a, b) =>
        new Date(a.date_submitted.$date) - new Date(b.date_submitted.$date),
    },
    {
      title: "User",
      key: "user",
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user_name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.user_email}
          </div>
          <Tag color="blue" style={{ marginTop: "4px" }}>
            {record.role || "unknown"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => (
        <div style={{ maxWidth: "300px" }}>
          {text.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusObj = STATUS_OPTIONS.find((s) => s.value === status);
        return (
          <Tag color={statusObj?.color || "default"}>
            {statusObj?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => {
        const priorityObj = PRIORITY_OPTIONS.find((p) => p.value === priority);
        return (
          <Tag color={priorityObj?.color || "default"}>
            {priorityObj?.label || priority}
          </Tag>
        );
      },
    },
    {
      title: "Attachments",
      dataIndex: "attachments",
      key: "attachments",
      width: 100,
      render: (attachments) => <span>{attachments?.length || 0} file(s)</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record._id.$oid)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="account-data-body">
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="/bug-reports">Bug Reports</a>
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="table-header" style={{ marginTop: "20px" }}>
        <Space size="middle">
          <Input.Search
            placeholder="Search by ID, name, email, or description"
            prefix={<SearchOutlined />}
            allowClear
            size="medium"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 350 }}
          />

          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            onChange={handleFilterByStatus}
          >
            <Option value="all">All Status</Option>
            {STATUS_OPTIONS.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>

          <ReloadOutlined
            style={{ fontSize: "16px", cursor: "pointer" }}
            spin={isLoading}
            onClick={() => setReload(!reload)}
          />

          <div style={{ marginLeft: "auto" }}>
            <Tag color="red">
              New: {bugReports.filter((b) => b.status === "new").length}
            </Tag>
            <Tag color="blue">
              In Progress:{" "}
              {bugReports.filter((b) => b.status === "in_progress").length}
            </Tag>
            <Tag color="green">
              Resolved:{" "}
              {bugReports.filter((b) => b.status === "resolved").length}
            </Tag>
          </div>
        </Space>
      </div>

      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1300 }}
        />
      </Spin>

      {/* Detail Modal */}
      <Modal
        title={`Bug Report #${selectedBug?._id.$oid.slice(-8)}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              handleEdit(selectedBug);
            }}
          >
            Edit
          </Button>,
        ]}
        width={800}
      >
        {selectedBug && (
          <div>
            <p>
              <strong>Full ID:</strong>{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  background: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                {selectedBug._id.$oid}
              </span>
            </p>
            <h3>User Information</h3>
            <p>
              <strong>Name:</strong> {selectedBug.user_name}
            </p>
            <p>
              <strong>Email:</strong> {selectedBug.user_email}
            </p>
            <p>
              <strong>Role:</strong> {selectedBug.role}
            </p>

            <h3 style={{ marginTop: "20px" }}>Bug Details</h3>
            <p>
              <strong>Status:</strong>{" "}
              <Tag
                color={
                  STATUS_OPTIONS.find((s) => s.value === selectedBug.status)
                    ?.color
                }
              >
                {selectedBug.status}
              </Tag>
            </p>
            <p>
              <strong>Priority:</strong>{" "}
              <Tag
                color={
                  PRIORITY_OPTIONS.find((p) => p.value === selectedBug.priority)
                    ?.color
                }
              >
                {selectedBug.priority}
              </Tag>
            </p>
            <p>
              <strong>Description:</strong>
            </p>
            <div
              style={{
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {selectedBug.description}
            </div>

            <h3 style={{ marginTop: "20px" }}>Context</h3>
            <p>
              <strong>Context:</strong> {selectedBug.context}
            </p>
            <p>
              <strong>Page URL:</strong>{" "}
              <a
                href={selectedBug.page_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedBug.page_url}
              </a>
            </p>
            <p>
              <strong>Date Submitted:</strong>{" "}
              {formatDateTime(new Date(selectedBug.date_submitted.$date))}
            </p>

            {selectedBug.attachments && selectedBug.attachments.length > 0 && (
              <>
                <h3 style={{ marginTop: "20px" }}>Attachments</h3>
                <Space direction="vertical">
                  {selectedBug.attachments.map((att, index) => (
                    <div key={index}>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {att.original_name}
                      </a>
                      {att.content_type.startsWith("image/") && (
                        <div style={{ marginTop: "8px" }}>
                          <Image
                            width={200}
                            src={att.url}
                            alt={att.original_name}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </Space>
              </>
            )}

            {selectedBug.notes && (
              <>
                <h3 style={{ marginTop: "20px" }}>Admin Notes</h3>
                <div
                  style={{
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "4px",
                  }}
                >
                  {selectedBug.notes}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Bug Report"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEdit}
        okText="Save"
      >
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Status:
          </label>
          <Select
            value={editForm.status}
            onChange={(value) => setEditForm({ ...editForm, status: value })}
            style={{ width: "100%" }}
          >
            {STATUS_OPTIONS.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Priority:
          </label>
          <Select
            value={editForm.priority}
            onChange={(value) => setEditForm({ ...editForm, priority: value })}
            style={{ width: "100%" }}
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <Option key={priority.value} value={priority.value}>
                {priority.label}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Admin Notes:
          </label>
          <TextArea
            rows={4}
            value={editForm.notes}
            onChange={(e) =>
              setEditForm({ ...editForm, notes: e.target.value })
            }
            placeholder="Add notes about this bug report..."
          />
        </div>
      </Modal>
    </div>
  );
}

export default AdminBugReports;
