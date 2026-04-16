import React, { useEffect } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  List,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { AppstoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  fetchAllConnectedApps,
  optimisticRemove,
  revokeApp,
} from "features/connectedAppsSlice";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (_) {
    return iso;
  }
}

function ConnectedApps() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.connectedApps);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    dispatch(fetchAllConnectedApps());
  }, [dispatch]);

  const handleRevoke = async (clientId, clientName) => {
    dispatch(optimisticRemove(clientId));
    try {
      await dispatch(revokeApp(clientId)).unwrap();
      messageApi.success(t("connected_apps.messages.revoked", { clientName }));
    } catch (err) {
      messageApi.error(
        err?.message || t("connected_apps.messages.revoke_failed")
      );
    }
  };

  const content = () => {
    if (loading && list.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      );
    }
    if (!loading && list.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("connected_apps.empty")}
        />
      );
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={list}
        renderItem={(app) => (
          <List.Item
            actions={[
              <Popconfirm
                key="revoke"
                title={t("connected_apps.confirm_revoke", {
                  clientName: app.client_name,
                })}
                onConfirm={() => handleRevoke(app.client_id, app.client_name)}
                okButtonProps={{ danger: true }}
              >
                <Button danger>{t("connected_apps.revoke")}</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={app.client_logo_url || undefined}
                  icon={!app.client_logo_url ? <AppstoreOutlined /> : undefined}
                  size={48}
                />
              }
              title={
                <Space>
                  <Typography.Text strong>{app.client_name}</Typography.Text>
                  {app.is_first_party && (
                    <Tag color="blue">{t("admin_oauth.table.first_party")}</Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={2}>
                  <Typography.Text type="secondary">
                    {t("connected_apps.granted_on", {
                      date: formatDate(app.granted_at),
                    })}
                  </Typography.Text>
                  {app.last_used_at && (
                    <Typography.Text type="secondary">
                      {t("connected_apps.last_used", {
                        date: formatDate(app.last_used_at),
                      })}
                    </Typography.Text>
                  )}
                  <Space wrap size={4}>
                    <Typography.Text type="secondary">
                      {t("connected_apps.scopes_label")}:
                    </Typography.Text>
                    {(app.granted_scopes || []).map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      {contextHolder}
      <Card
        title={t("connected_apps.title")}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => dispatch(fetchAllConnectedApps())}
            loading={loading}
          >
            {t("admin_oauth.refresh")}
          </Button>
        }
      >
        {content()}
      </Card>
    </div>
  );
}

export default ConnectedApps;
