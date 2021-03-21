import React, { useState } from "react";
import { Modal, Typography } from "antd";
import MentorAppInfo from "./MentorAppInfo";
import MentorAppProgress from "./MentorAppProgress";
import "./css/MentorApplicationView.scss";
import appData from "../resources/mentorApplication.json";

const { Text } = Typography;

function MentorApplicationView({ data, provided }) {
  const [note, setNote] = useState("Insert a note here");
  const [visible, setVisible] = useState(false);

  const NotesContainer = () => {
    return (
      <div className="notes-container">
        <MentorAppProgress progress={appData.application_state} />
        <div className="notes-title">Notes</div>
        <div className="note-wrap">
          <Text
            style={{ fontWeight: "bold" }}
            editable={{
              onChange: setNote,
              tooltip: "Click to edit note",
            }}
          >
            {note}
          </Text>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div onClick={() => setVisible(true)}>{data.content}</div>
      <Modal
        visible={visible}
        footer={null}
        className="app-modal"
        onCancel={() => setVisible(false)}
      >
        <div className="view-container">
          <MentorAppInfo info={data} />
          <div className="status-container">
            <NotesContainer />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MentorApplicationView;
