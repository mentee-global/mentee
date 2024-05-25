import { useSelector, useDispatch } from 'react-redux';
import { setPanel } from 'features/meetingPanelSlice';
import { JaaSMeeting, JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState } from 'react';

const MeetingPanel = () => {
  var panelComponent = useSelector((state) => state.meetingPanel.panelComponent);

  if (panelComponent)
  {
    var AppID = panelComponent.app_id;
    var RoomName = panelComponent.room_name;
    var Token = panelComponent.token;
    return (
      <div>
         <JaaSMeeting
          getIFrameRef={iframeRef => {
            iframeRef.style.position = 'fixed';
            iframeRef.style.bottom = 0;
            iframeRef.style.right = 0;
            iframeRef.style.width = '30%';
            iframeRef.style.height = 'calc(100vh - 50px)';
          }}
          appId={AppID}
          roomName={{AppID} + '/' + RoomName}
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
  } else {return <div></div>}
};

export default MeetingPanel;