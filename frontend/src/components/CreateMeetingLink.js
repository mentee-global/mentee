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
  var url;

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(url);
      message.success("URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      message.error("Failed to copy URL to clipboard.");
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
          <Button key="generate" type="primary" onClick={url = generateURL}>
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