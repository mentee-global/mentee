import { useSelector, useDispatch } from 'react-redux';
import { setPanel } from 'features/meetingPanelSlice';
import { JaaSMeeting, JitsiMeeting } from '@jitsi/react-sdk';
import React, { useRef, useState } from 'react';

const MeetingPanel = () => {
  const panelComponent = useSelector((state) => state.meetingPanel.panelComponent);
  const dispatch = useDispatch();

  return (
    <div>
      {panelComponent}
    </div>
  );
};

export default MeetingPanel;