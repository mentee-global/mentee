import { useSelector, useDispatch } from "react-redux";
import { JaaSMeeting, JitsiMeeting } from "@jitsi/react-sdk";
import React, { useRef, useState } from "react";
import { setPanel, removePanel } from "features/meetingPanelSlice";

const MeetingPanel = () => {
  const dispatch = useDispatch();
  var panelComponent = useSelector(
    (state) => state.meetingPanel.panelComponent
  );

  const ClosePanel = (event) => {
    if (event === undefined) {
      dispatch(removePanel());
    }
  };

  if (panelComponent) {
    return (
      <div style={{ position: "relative", width: "30%" }}>
        <JaaSMeeting
          getIFrameRef={(iframeRef) => {
            iframeRef.style.position = "fixed";
            iframeRef.style.bottom = 0;
            iframeRef.style.right = 0;
            iframeRef.style.width = "30%";
            iframeRef.style.height = "100%";
          }}
          appId={panelComponent.app_id}
          roomName={panelComponent.room_name}
          jwt={panelComponent.token}
          configOverwrite={{
            disableThirdPartyRequests: true,
            disableLocalVideoFlip: true,
            backgroundAlpha: 0.5,
          }}
          interfaceConfigOverwrite={{
            VIDEO_LAYOUT_FIT: "nocrop",
            MOBILE_APP_PROMO: false,
            TILE_VIEW_MAX_COLUMNS: 4,
          }}
          onReadyToClose={ClosePanel}
        />
        <button
          style={{
            position: "fixed",
            top: "0",
            right: "27.5%",
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "2em",
            zIndex: "100",
          }}
          onClick={() => ClosePanel()}
        >
          x
        </button>
      </div>
    );
  } else {
    return <div></div>;
  }
};

export default MeetingPanel;
