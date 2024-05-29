import React, { useState } from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

function URLGeneration() {
  const [urlModalVisible, setUrlModalVisible] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const { t } = useTranslation();

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(generatedUrl);
      message.success(t("meeting.copyMessage"));
    } catch (error) {
      console.error(t("meeting.errorCopy"), error);
      message.error(t("meeting.errorCopy"));
    }
  };

  const getURL = () => {
    try {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "https://jitsi.ff3l.net/";
      for (let i = 0; i < 10; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      setGeneratedUrl(result);
    } catch (error) {
      console.error(t("meeting.errorGenerating"));
      message.error(t("meeting.errorGenerating"));
    }
  };

  return (
    <>
      <Modal
        title={t("meeting.title")}
        visible={urlModalVisible}
        onCancel={() => setUrlModalVisible(false)}
        footer={[
          <Button key="generate" type="primary" onClick={getURL}>
            {t("meeting.generateButton")}
          </Button>,
          <Button key="cancel" onClick={() => setUrlModalVisible(false)}>
            {t("meeting.cancelButton")}
          </Button>,
        ]}
      >
        <div>
          <Title level={4}>{t("meeting.generatedURL")}</Title>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Input value={generatedUrl} readOnly />
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              style={{ marginLeft: "8px" }}
            />
          </div>
        </div>
        <div style={{ marginTop: "14px", fontSize: "12px" }}>
          {t("meeting.limitWarning")}
        </div>
      </Modal>
    </>
  );
}

export default URLGeneration;
