import React, { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  clearLastCreatedSecret,
  createClient,
  fetchAll,
} from "features/adminOauthClientsSlice";
import OAuthClientForm from "components/oauth/OAuthClientForm";
import SecretOnceModal from "components/oauth/SecretOnceModal";

function AdminOAuthClients() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list, loading, lastCreatedSecret, lastCreatedClientId } = useSelector(
    (state) => state.adminOauthClients
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    dispatch(fetchAll());
  }, [dispatch]);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const result = await dispatch(createClient(values)).unwrap();
      if (result?.client_secret) {
        form.resetFields();
        setDrawerOpen(false);
      } else {
        messageApi.error(t("admin_oauth.messages.create_failed"));
      }
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.create_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: t("admin_oauth.table.name"),
      dataIndex: "client_name",
      key: "client_name",
      render: (name, record) => (
        <Link to={`/admin/oauth-clients/${record.client_id}`}>{name}</Link>
      ),
    },
    {
      title: t("admin_oauth.table.client_id"),
      dataIndex: "client_id",
      key: "client_id",
      render: (id) => <Typography.Text code>{id}</Typography.Text>,
    },
    {
      title: t("admin_oauth.table.redirect_uris"),
      dataIndex: "redirect_uris",
      key: "redirect_uris",
      render: (uris) => (
        <Space direction="vertical" size={2}>
          {(uris || []).map((u) => (
            <Typography.Text key={u} type="secondary" style={{ fontSize: 12 }}>
              {u}
            </Typography.Text>
          ))}
        </Space>
      ),
    },
    {
      title: t("admin_oauth.table.scopes"),
      dataIndex: "allowed_scopes",
      key: "allowed_scopes",
      render: (scopes) => (
        <Space wrap>
          {(scopes || []).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t("admin_oauth.table.status"),
      dataIndex: "is_active",
      key: "is_active",
      render: (active, record) => {
        const tags = [];
        tags.push(
          <Tag key="status" color={active ? "green" : "red"}>
            {active
              ? t("admin_oauth.table.active")
              : t("admin_oauth.table.inactive")}
          </Tag>
        );
        if (record.is_first_party) {
          tags.push(
            <Tooltip
              key="fp-tip"
              title={t("admin_oauth.table.first_party_tip")}
            >
              <Tag color="blue">{t("admin_oauth.table.first_party")}</Tag>
            </Tooltip>
          );
        }
        return <Space>{tags}</Space>;
      },
    },
  ];

  const modalClient = lastCreatedClientId
    ? list.find((c) => c.client_id === lastCreatedClientId)
    : null;

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Space
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t("admin_oauth.title")}
        </Typography.Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchAll())}
            loading={loading}
          >
            {t("admin_oauth.refresh")}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            {t("admin_oauth.new_client")}
          </Button>
        </Space>
      </Space>

      <Table
        rowKey="client_id"
        columns={columns}
        dataSource={list}
        loading={loading}
      />

      <Drawer
        title={t("admin_oauth.new_client")}
        width={560}
        open={drawerOpen}
        onClose={() => {
          form.resetFields();
          setDrawerOpen(false);
        }}
        destroyOnClose
      >
        <OAuthClientForm
          form={form}
          mode="create"
          loading={submitting}
          submitLabel={t("admin_oauth.form.create")}
          onFinish={handleCreate}
        />
      </Drawer>

      <SecretOnceModal
        open={Boolean(lastCreatedSecret)}
        secret={lastCreatedSecret}
        clientName={modalClient?.client_name}
        onClose={() => dispatch(clearLastCreatedSecret())}
      />
    </div>
  );
}

export default AdminOAuthClients;
