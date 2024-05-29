import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { generateToken } from "utils/api";
import { useDispatch } from 'react-redux';
import { setPanel, removePanel } from 'features/meetingPanelSlice';
import { useHistory } from "react-router-dom";

const { Title } = Typography;

function Meeting() {
  const joinButtonRef = useRef(null);
  const [urlModalVisible, setUrlModalVisible] = useState(true);
  const [RoomName, setRoomName] = useState("");
  const [Token, setToken] = useState("");
  const [AppID, setAppID] = useState("");
  const history = useHistory();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText('https://8x8.vc/' + AppID + '/' + RoomName);
      message.success(t("meeting.copyMessage"));
    } catch (error) {
      console.error(t("meeting.errorCopy"), error);
      message.error(t("meeting.errorCopy"));
    }
  };

  const getRoomName = () => {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let generatedRoomName = '';
      for (let i = 0; i < 10; i++) {
        generatedRoomName += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setRoomName(generatedRoomName.split('/').pop());
    } catch (error) {
      console.error(t("meeting.errorGenerating"));
      message.error(t("meeting.errorGenerating"));
    }
  };

  const joinMeeting = async () => {
    try {
      if (!RoomName) {
        console.error(t("meeting.roomName"));
        message.error(t("meeting.roomName"));
        return;
      }
      
      const response = await getToken();
      dispatch(removePanel());
      setTimeout(() => {
        dispatch(setPanel({ app_id: response.appID, room_name: RoomName, token: response.token }));
      }, 500);
    } catch (error) {
      console.error("Error: ", error);
      message.error(t("meeting.getToken"));
    }
  };

  const getToken = async () => {
    try {
      const resp = await generateToken();
      setToken(resp.token);
      setAppID(resp.appID);
      return resp
    } catch (error) {
      console.error('Error:', error);
      message.error(t("meeting.generateToken"));
    }
  };

  const redirectBack = () => {
    history.goBack();
  };

  const handleCancel = () => {
    setUrlModalVisible(false);
    redirectBack();
  };

  return (
    <>
      <Modal
        title={t("meeting.title")}
        visible={urlModalVisible}
        onCancel={handleCancel}
        footer={[
          <div key="left-buttons" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button key="generate" style={{ color: 'red', borderColor: 'red', backgroundColor: 'white' }} onClick={getRoomName}>
              {t("meeting.generateButton")}
            </Button>,
            <div>
              <Button ref={joinButtonRef} key="join" type="primary" onClick={joinMeeting}>
                {t("meeting.joinMeeting")}
              </Button>,
              <Button key="cancel" style={{ marginLeft: '8px' }} onClick={handleCancel}>
                {t("meeting.cancelButton")}
              </Button>,
            </div>  
          </div>
        ]}
      >
        <div>
          <Title level={4}>{t("meeting.generatedURL")}</Title>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Input
              value={RoomName}
              onChange={(e) => setRoomName(e.target.value.split('/').pop())}
              placeholder={t("meeting.placeHolder")}
            />
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

