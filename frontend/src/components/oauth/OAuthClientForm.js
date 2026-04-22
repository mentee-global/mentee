import React from "react";
import {
  Alert,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Divider,
  Space,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import UserSearchSelect from "components/oauth/UserSearchSelect";
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABELS } from "utils/consts";

const SCOPE_PRESETS = [
  { value: "openid", label: "openid" },
  { value: "email", label: "email" },
  { value: "profile", label: "profile" },
  { value: "mentee.role", label: "mentee.role" },
];

// Roles an admin can whitelist a client for. Excludes ADMIN and SUPPORT
// (they don't authorize OAuth flows today) and stores string values to match
// the backend `Users.role` storage format.
const WHITELIST_ROLE_OPTIONS = [
  ACCOUNT_TYPE.MENTOR,
  ACCOUNT_TYPE.MENTEE,
  ACCOUNT_TYPE.PARTNER,
  ACCOUNT_TYPE.HUB,
  ACCOUNT_TYPE.MODERATOR,
  ACCOUNT_TYPE.GUEST,
].map((value) => ({
  value: String(value),
  label: ACCOUNT_TYPE_LABELS[value] || String(value),
}));

function OAuthClientForm({
  form,
  initialValues,
  onFinish,
  submitLabel,
  loading,
  mode, // "create" | "edit"
}) {
  const { t } = useTranslation();
  const isEdit = mode === "edit";

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        redirect_uris: [""],
        allowed_scopes: ["openid", "email", "profile", "mentee.role"],
        is_first_party: false,
        is_active: true,
        whitelist_roles: [],
        whitelist_user_ids: [],
        bypass_admin: false,
        ...initialValues,
      }}
      onFinish={onFinish}
    >
      {!isEdit && (
        <Form.Item
          name="client_id"
          label={t("admin_oauth.form.client_id")}
          rules={[
            {
              required: true,
              message: t("admin_oauth.form.client_id_required"),
            },
            { max: 128 },
            {
              pattern: /^[a-zA-Z0-9_\-.]+$/,
              message: t("admin_oauth.form.client_id_pattern"),
            },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
      )}

      <Form.Item
        name="client_name"
        label={t("admin_oauth.form.name")}
        rules={[
          { required: true, message: t("admin_oauth.form.name_required") },
          { max: 255 },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="client_logo_url"
        label={t("admin_oauth.form.logo_url")}
        rules={[{ type: "url", warningOnly: true }]}
      >
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.List
        name="redirect_uris"
        rules={[
          {
            validator: async (_, uris) => {
              if (!uris || uris.length === 0) {
                return Promise.reject(
                  new Error(t("admin_oauth.form.redirect_uris_required"))
                );
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              {t("admin_oauth.form.redirect_uris")}
            </div>
            {fields.map((field) => (
              <Space
                key={field.key}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Form.Item
                  {...field}
                  style={{ marginBottom: 0, width: 360 }}
                  rules={[
                    {
                      required: true,
                      message: t("admin_oauth.form.redirect_uri_required"),
                    },
                    {
                      pattern: /^https?:\/\//,
                      message: t("admin_oauth.form.redirect_uri_pattern"),
                    },
                  ]}
                >
                  <Input placeholder="https://example.com/oauth/callback" />
                </Form.Item>
                {fields.length > 1 && (
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                )}
              </Space>
            ))}
            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="dashed"
                onClick={() => add("")}
                icon={<PlusOutlined />}
              >
                {t("admin_oauth.form.add_redirect_uri")}
              </Button>
              <Form.ErrorList errors={errors} />
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item
        name="allowed_scopes"
        label={t("admin_oauth.form.allowed_scopes")}
        rules={[
          {
            required: true,
            message: t("admin_oauth.form.allowed_scopes_required"),
          },
        ]}
      >
        <Select
          mode="tags"
          placeholder="openid email profile mentee.role"
          options={SCOPE_PRESETS}
        />
      </Form.Item>

      <Form.Item
        name="is_first_party"
        label={t("admin_oauth.form.is_first_party")}
        valuePropName="checked"
        tooltip={t("admin_oauth.form.is_first_party_tooltip")}
      >
        <Switch />
      </Form.Item>

      {isEdit && (
        <Form.Item
          name="is_active"
          label={t("admin_oauth.form.is_active")}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      )}

      <Divider>{t("admin_oauth.form.whitelist_section")}</Divider>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t("admin_oauth.form.whitelist_hint")}
      />

      <Form.Item
        name="whitelist_roles"
        label={t("admin_oauth.form.whitelist_roles")}
      >
        <Select
          mode="multiple"
          allowClear
          placeholder={t("admin_oauth.form.whitelist_roles_placeholder")}
          options={WHITELIST_ROLE_OPTIONS}
        />
      </Form.Item>

      <Form.Item
        name="whitelist_user_ids"
        label={t("admin_oauth.form.whitelist_users")}
      >
        <UserSearchSelect />
      </Form.Item>

      <Form.Item
        name="bypass_admin"
        label={t("admin_oauth.form.bypass_admin")}
        valuePropName="checked"
        tooltip={t("admin_oauth.form.bypass_admin_tooltip")}
      >
        <Switch />
      </Form.Item>

      {isEdit && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t("admin_oauth.form.whitelist_changes_tokens_note")}
        />
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default OAuthClientForm;
