import React, { useState } from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {generateToken} from "utils/api";

const { Title } = Typography;

function Meeting() {
  const [urlModalVisible, setUrlModalVisible] = useState(true);
  const [generatedRoomName, setGeneratedRoomName] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [AppID, setGeneratedAppID] = useState("");
  const { t } = useTranslation();

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(generatedRoomName);
      message.success(t("meeting.copyMessage"));
    } catch (error) {
      console.error(t("meeting.errorCopy"), error);
      message.error(t("meeting.errorCopy"));
    }
  };

  const getRoomName = () => {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let RoomName = '';
      for (let i = 0; i < 10; i++) {
        RoomName += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setGeneratedRoomName(RoomName);
    } catch (error) {
      console.error(t("meeting.errorGenerating"));
      message.error(t("meeting.errorGenerating"));
    }
  };

  const joinMeeting = () => {
    try {
      getToken();
      // showMeetingPanel(generatedToken, AppID);
      message.success(generatedToken);
      message.success(AppID);
    } catch (error) {
      console.error("Error: ", error);
      message.error("Unable to join meeting");
    }
  };

  const getToken = () => {
    try {
      generateToken().then(resp => {
        setGeneratedToken(resp.token);
        setGeneratedAppID(resp.appID);
      }).catch(error => {
        console.error('Error:', error);
        message.error("Unable to generate token");
      });
    } catch (error) {
      console.error('Error:', error);
      message.error("Unable to generate token");
    }
  };

  return (
    <>
      <Modal
        title={t("meeting.title")}
        visible={urlModalVisible}
        onCancel={() => setUrlModalVisible(false)}
        footer={[
          <Button key="generate" type="primary" onClick={getRoomName}>
            {t("meeting.generateButton")}
          </Button>,
          <Button key="join" type="primary" onClick={joinMeeting}>
            {"Join Meeting"}
          </Button>,
          <Button key="cancel" onClick={() => setUrlModalVisible(false)}>
            {t("meeting.cancelButton")}
          </Button>,
        ]}
      >
        <div>
          <Title level={4}>{t("meeting.generatedURL")}</Title>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Input value={generatedRoomName} readOnly />
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

export default Meeting;