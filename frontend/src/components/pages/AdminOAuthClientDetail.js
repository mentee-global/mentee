import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
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
  deleteClient,
  fetchOne,
  revokeAllTokens,
  rotateSecret,
  updateClient,
} from "features/adminOauthClientsSlice";
import OAuthClientForm from "components/oauth/OAuthClientForm";
import SecretOnceModal from "components/oauth/SecretOnceModal";
import { useAuth } from "utils/hooks/useAuth";
import { ACCOUNT_TYPE_LABELS } from "utils/consts";
import { fetchAdminUsersByIds } from "utils/api";

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
  const [whitelistUserDetails, setWhitelistUserDetails] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    onAuthStateChanged(() => dispatch(fetchOne(clientId)));
    // Clear any stale secret on mount/navigation so we never accidentally
    // re-display a secret from a prior screen.
    return () => {
      dispatch(clearLastCreatedSecret());
    };
  }, [clientId, dispatch, onAuthStateChanged]);

  useEffect(() => {
    const ids = client?.whitelist_user_ids || [];
    if (!ids.length) {
      setWhitelistUserDetails([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const users = await fetchAdminUsersByIds(ids);
      if (!cancelled) setWhitelistUserDetails(users);
    })();
    return () => {
      cancelled = true;
    };
  }, [client?.whitelist_user_ids]);

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
      whitelist_roles: client.whitelist_roles || [],
      whitelist_user_ids: client.whitelist_user_ids || [],
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

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await dispatch(deleteClient(clientId)).unwrap();
      const total =
        (res?.access_tokens_deleted || 0) +
        (res?.refresh_tokens_deleted || 0) +
        (res?.authorization_codes_deleted || 0) +
        (res?.consents_deleted || 0);
      messageApi.success(
        t("admin_oauth.messages.client_deleted", {
          clientId,
          count: total,
        })
      );
      setDeleteModalOpen(false);
      history.push("/admin/oauth-clients");
    } catch (err) {
      messageApi.error(err?.message || t("admin_oauth.messages.delete_failed"));
    } finally {
      setDeleting(false);
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
              <Tooltip title={t("admin_oauth.table.first_party_tip")}>
                <Tag color="blue">{t("admin_oauth.table.first_party")}</Tag>
              </Tooltip>
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
            <Tooltip
              title={
                client.is_active
                  ? t("admin_oauth.detail.delete_disabled_tip")
                  : t("admin_oauth.detail.delete_tip")
              }
            >
              <Popconfirm
                title={t("admin_oauth.detail.delete_step1_title")}
                description={t("admin_oauth.detail.delete_step1_description")}
                onConfirm={openDeleteModal}
                okText={t("admin_oauth.detail.delete_step1_ok")}
                okButtonProps={{ danger: true }}
                cancelText={t("admin_oauth.detail.delete_step1_cancel")}
                disabled={client.is_active}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={client.is_active}
                >
                  {t("admin_oauth.detail.delete")}
                </Button>
              </Popconfirm>
            </Tooltip>
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
          <Descriptions.Item label={t("admin_oauth.form.whitelist_roles")}>
            {(client.whitelist_roles || []).length === 0 ? (
              <Typography.Text type="secondary">
                {t("admin_oauth.detail.whitelist_open")}
              </Typography.Text>
            ) : (
              <Space wrap>
                {(client.whitelist_roles || []).map((r) => (
                  <Tag key={r}>{ACCOUNT_TYPE_LABELS[Number(r)] || r}</Tag>
                ))}
              </Space>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t("admin_oauth.form.whitelist_users")}>
            {(client.whitelist_user_ids || []).length === 0 ? (
              <Typography.Text type="secondary">
                {t("admin_oauth.detail.whitelist_no_users")}
              </Typography.Text>
            ) : (
              <Space direction="vertical" size={2}>
                {(client.whitelist_user_ids || []).map((id) => {
                  const u = whitelistUserDetails.find((x) => x.id === id);
                  if (!u) {
                    return (
                      <Typography.Text key={id} code>
                        {id}
                      </Typography.Text>
                    );
                  }
                  const name = u.name || (u.email || "").split("@")[0];
                  return (
                    <Typography.Text key={id}>
                      {name} &lt;{u.email}&gt;
                    </Typography.Text>
                  );
                })}
              </Space>
            )}
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

      <Modal
        open={deleteModalOpen}
        onCancel={() => (deleting ? null : setDeleteModalOpen(false))}
        title={
          <Space>
            <ExclamationCircleFilled style={{ color: "#ff4d4f" }} />
            <span>
              {t("admin_oauth.detail.delete_modal_title", {
                clientName: client.client_name,
              })}
            </span>
          </Space>
        }
        okText={t("admin_oauth.detail.delete_modal_ok")}
        cancelText={t("admin_oauth.detail.delete_modal_cancel")}
        okButtonProps={{
          danger: true,
          disabled: deleteConfirmText !== client.client_id || deleting,
          loading: deleting,
        }}
        cancelButtonProps={{ disabled: deleting }}
        onOk={handleDelete}
        maskClosable={false}
        closable={!deleting}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="error"
            showIcon
            message={t("admin_oauth.detail.delete_modal_warning_title")}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>{t("admin_oauth.detail.delete_modal_warning_1")}</li>
                <li>{t("admin_oauth.detail.delete_modal_warning_2")}</li>
                <li>{t("admin_oauth.detail.delete_modal_warning_3")}</li>
                <li>{t("admin_oauth.detail.delete_modal_warning_4")}</li>
              </ul>
            }
          />
          <Typography.Text>
            {t("admin_oauth.detail.delete_modal_type_prompt")}{" "}
            <Typography.Text code>{client.client_id}</Typography.Text>
          </Typography.Text>
          <Input
            placeholder={client.client_id}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={deleting}
            autoComplete="off"
          />
        </Space>
      </Modal>
    </div>
  );
}

export default AdminOAuthClientDetail;
