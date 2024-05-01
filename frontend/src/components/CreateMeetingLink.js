import React, { useState } from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import axios from "axios";
import {
  generateURL
} from "utils/api";

const { Title } = Typography;

function URLGeneration() {
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(generatedUrl);
      message.success("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      message.error("Failed to copy URL to clipboard.");
    }
  };

  const getURL = () => {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = 'https://jitsi.ff3l.net/';
      for (let i = 0; i < 10; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setGeneratedUrl(result);
    } catch (error) {
      console.error("Failed to generate meeting link.");
      message.error("Failed to generate meeting link.");
    }
  };

  return (
    <>
      <Button type="primary" style={{ marginTop: "16px", marginLeft: "8px", display: "flex", alignItems: "center"}} onClick={() => setUrlModalVisible(true)}>
        Create Meeting Link
      </Button>
      <Modal
        title="Generate Meeting Link"
        visible={urlModalVisible}
        onCancel={() => setUrlModalVisible(false)}
        footer={[
          <Button key="generate" type="primary" onClick={getURL}>
            Generate
          </Button>,
          <Button key="cancel" onClick={() => setUrlModalVisible(false)}>
            Cancel
          </Button>,
        ]}
      >
        <div>
          <Title level={4}>Generated URL:</Title>
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
      </Modal>
    </>
  );
}

export default URLGeneration;