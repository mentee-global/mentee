import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  ReloadOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useHistory, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  clearLastCreatedSecret,
  fetchOne,
  revokeAllTokens,
  rotateSecret,
  updateClient,
} from "features/adminOauthClientsSlice";
import OAuthClientForm from "components/oauth/OAuthClientForm";
import SecretOnceModal from "components/oauth/SecretOnceModal";
import { useAuth } from "utils/hooks/useAuth";

function AdminOAuthClientDetail() {
  const { t } = useTranslation();
  const { clientId } = useParams();
  const history = useHistory();
  const dispatch = useDispatch();
  const client = useSelector((state) => state.adminOauthClients.byId[clientId]);
  const { lastCreatedSecret } = useSelector((state) => state.adminOauthClients);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    onAuthStateChanged(() => dispatch(fetchOne(clientId)));
    // Clear any stale secret on mount/navigation so we never accidentally
    // re-display a secret from a prior screen.
    return () => {
      dispatch(clearLastCreatedSecret());
    };
  }, [clientId, dispatch, onAuthStateChanged]);

  if (!client) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const handleEdit = () => {
    form.setFieldsValue({
      client_name: client.client_name,
      client_logo_url: client.client_logo_url || "",
      redirect_uris: client.redirect_uris?.length ? client.redirect_uris : [""],
      allowed_scopes: client.allowed_scopes || [],
      is_first_party: !!client.is_first_party,
      is_active: !!client.is_active,
    });
    setEditOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await dispatch(
        updateClient({
          clientId,
          payload: values,
        })
      ).unwrap();
      messageApi.success(t("admin_oauth.messages.saved"));
      setEditOpen(false);
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async () => {
    try {
      await dispatch(rotateSecret(clientId)).unwrap();
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.rotate_failed"));
    }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await dispatch(revokeAllTokens(clientId)).unwrap();
      const n =
        (res?.access_tokens_revoked || 0) + (res?.refresh_tokens_revoked || 0);
      messageApi.success(
        t("admin_oauth.messages.tokens_revoked", { count: n })
      );
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.revoke_failed"));
    }
  };

  const handleToggleActive = async () => {
    try {
      await dispatch(
        updateClient({
          clientId,
          payload: { is_active: !client.is_active },
        })
      ).unwrap();
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.save_failed"));
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {contextHolder}
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push("/admin/oauth-clients")}
        >
          {t("admin_oauth.detail.back")}
        </Button>
      </Space>

      <Card
        title={
          <Space>
            <Typography.Text strong>{client.client_name}</Typography.Text>
            <Tag color={client.is_active ? "green" : "red"}>
              {client.is_active
                ? t("admin_oauth.table.active")
                : t("admin_oauth.table.inactive")}
            </Tag>
            {client.is_first_party && (
              <Tag color="blue">{t("admin_oauth.table.first_party")}</Tag>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              {t("admin_oauth.detail.edit")}
            </Button>
            <Popconfirm
              title={t("admin_oauth.detail.confirm_rotate")}
              onConfirm={handleRotate}
            >
              <Button icon={<SafetyCertificateOutlined />}>
                {t("admin_oauth.detail.rotate_secret")}
              </Button>
            </Popconfirm>
            <Popconfirm
              title={t("admin_oauth.detail.confirm_revoke_all", {
                clientName: client.client_name,
              })}
              onConfirm={handleRevokeAll}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<ReloadOutlined />}>
                {t("admin_oauth.detail.revoke_all_tokens")}
              </Button>
            </Popconfirm>
            {client.is_active ? (
              <Popconfirm
                title={t("admin_oauth.detail.confirm_deactivate")}
                onConfirm={handleToggleActive}
              >
                <Button danger icon={<StopOutlined />}>
                  {t("admin_oauth.detail.deactivate")}
                </Button>
              </Popconfirm>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleToggleActive}
              >
                {t("admin_oauth.detail.reactivate")}
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="client_id">
            <Typography.Text code copyable>
              {client.client_id}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.form.logo_url")}>
            {client.client_logo_url || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.table.redirect_uris")}>
            <Space direction="vertical" size={2}>
              {(client.redirect_uris || []).map((u) => (
                <Typography.Text key={u} code>
                  {u}
                </Typography.Text>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.table.scopes")}>
            <Space wrap>
              {(client.allowed_scopes || []).map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.detail.token_auth_method")}>
            <Typography.Text code>
              {client.token_endpoint_auth_method || "—"}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.detail.created_at")}>
            {client.created_at || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.detail.updated_at")}>
            {client.updated_at || "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title={t("admin_oauth.detail.edit")}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnClose
        width={640}
      >
        <OAuthClientForm
          form={form}
          mode="edit"
          loading={saving}
          submitLabel={t("admin_oauth.form.save")}
          onFinish={handleSave}
        />
      </Modal>

      <SecretOnceModal
        open={Boolean(lastCreatedSecret)}
        secret={lastCreatedSecret}
        clientName={client.client_name}
        onClose={() => dispatch(clearLastCreatedSecret())}
      />
    </div>
  );
}

export default AdminOAuthClientDetail;
