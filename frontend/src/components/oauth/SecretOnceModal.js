import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Checkbox, Alert, Space, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

function SecretOnceModal({ open, secret, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  const handleCopy = async () => {
    if (!secret) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(secret);
      } else {
        const ta = document.createElement("textarea");
        ta.value = secret;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      messageApi.success(t("admin_oauth.secret_modal.copy_success"));
    } catch (err) {
      messageApi.error(t("admin_oauth.secret_modal.copy_error"));
    }
  };

  return (
    <Modal
      open={open}
      title={t("admin_oauth.secret_modal.title")}
      closable={false}
      maskClosable={false}
      keyboard={false}
      onCancel={onClose}
      footer={[
        <Button key="done" type="primary" disabled={!copied} onClick={onClose}>
          {t("admin_oauth.secret_modal.done")}
        </Button>,
      ]}
      destroyOnClose
    >
      {contextHolder}
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Alert
          type="warning"
          role="alert"
          // Screen readers announce the warning when the modal opens.
          message={
            <span aria-live="assertive">
              {t("admin_oauth.secret_modal.body")}
            </span>
          }
        />
        <Input.Password
          value={secret || ""}
          readOnly
          visibilityToggle
          addonAfter={
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              aria-label={t("admin_oauth.secret_modal.copy")}
            >
              {t("admin_oauth.secret_modal.copy")}
            </Button>
          }
        />
        <Checkbox
          checked={copied}
          onChange={(e) => setCopied(e.target.checked)}
        >
          {t("admin_oauth.secret_modal.confirm")}
        </Checkbox>
      </Space>
    </Modal>
  );
}

export default SecretOnceModal;
