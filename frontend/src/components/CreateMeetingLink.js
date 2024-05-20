import React, { useState, useEffect , useRef} from "react";
import { Modal, Button, Input, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { generateToken } from "utils/api";
import { useDispatch } from 'react-redux';
import { setPanel, removePanel } from 'features/meetingPanelSlice';
import { JaaSMeeting } from '@jitsi/react-sdk';
import { useHistory } from "react-router-dom";

const { Title } = Typography;

function Meeting() {
  const joinButtonRef = useRef(null);
  const [urlModalVisible, setUrlModalVisible] = useState(true);
  const [RoomName, setRoomName] = useState("");
  const [Token, setToken] = useState("");
  const [AppID, setAppID] = useState("");
  const [reloadFlag, setReloadFlag] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const ReactAppID = process.env.REACT_APP_EIGHT_X_EIGHT_APP_ID;

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(RoomName);;
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
      setRoomName(generatedRoomName);
    } catch (error) {
      console.error(t("meeting.errorGenerating"));
      message.error(t("meeting.errorGenerating"));
    }
  };

  const createSidePanel = () => {
    return (
      <div>
        <JaaSMeeting
          getIFrameRef={iframeRef => {
            iframeRef.style.position = 'fixed';
            iframeRef.style.bottom = 0;
            iframeRef.style.right = 0;
            iframeRef.style.width = '30%';
            iframeRef.style.height = '93vh';
          }}
          appId={AppID}
          roomName={ReactAppID + '/' + RoomName}
          jwt={Token}
          configOverwrite={{
            disableThirdPartyRequests: true,
            disableLocalVideoFlip: true,
            backgroundAlpha: 0.5
          }}
          interfaceConfigOverwrite={{
            VIDEO_LAYOUT_FIT: 'nocrop',
            MOBILE_APP_PROMO: false,
            TILE_VIEW_MAX_COLUMNS: 4
          }}
        />
      </div>
    );
  };

  const joinMeeting = () => {
    try {
      if (!RoomName) {
        console.error(t("meeting.roomName"));
        message.error(t("meeting.roomName"));
        return;
      }
      getToken(); 
      dispatch(removePanel());
      document.body.style.marginRight = "30%";
      document.body.style.transition = "margin-right 0.3s";
      dispatch(setPanel(createSidePanel()));
    } catch (error) {
      console.error("Error: ", error);
      message.error(t("meeting.getToken"));
    }
  };

  const getToken = () => {
    try {
      if (reloadFlag) {
        localStorage.setItem("roomName", RoomName);
        window.location.reload();
      }
      setReloadFlag(true);
      generateToken().then(resp => {
        setToken(resp.token);
        setAppID(resp.appID);
      }).catch(error => {
        console.error('Error:', error);
        message.error(t("meeting.generateToken"));
      });
    } catch (error) {
      console.error('Error:', error);
      message.error(t("meeting.generateToken"));
    }
  };

  const redirectToMessages = () => {

    history.push("/appointments");

  };

  useEffect(() => {
    const roomNameFromLocalStorage = localStorage.getItem("roomName");
    if (roomNameFromLocalStorage) {
      setRoomName(roomNameFromLocalStorage);
      localStorage.removeItem("roomName");
      setTimeout(() => {
        if (joinButtonRef.current) {
          joinButtonRef.current.click();
        }
      }, 1000);
    }
  }, []);

  return (
    <>
      <Modal
        title={t("meeting.title")}
        visible={urlModalVisible}
        onCancel={() => {

          setUrlModalVisible(false);

          redirectToMessages();

        }}
        footer={[
          <div key="left-buttons" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button key="generate" style={{ color: 'red', borderColor: 'red', backgroundColor: 'white' }} onClick={getRoomName}>
              {t("meeting.generateButton")}
            </Button>,
            <div>
              <Button ref={joinButtonRef} key="join" type="primary" onClick={joinMeeting}>
                {t("meeting.joinMeeting")}
              </Button>,
              <Button key="cancel" style={{ marginLeft: '8px' }} onClick={redirectToMessages}>
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
              onChange={(e) => setRoomName(e.target.value)}
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
