import React, { useState } from "react";
import { Modal, Typography } from "antd";
import MentorAppInfo from "./MentorAppInfo";
import MentorAppProgress from "./MentorAppProgress";
import "./css/MentorApplicationView.scss";
import appData from "../resources/mentorApplication.json";

const { Text } = Typography;

function MentorApplicationView({ data }) {
  const [note, setNote] = useState("Insert a note here");
  const [visible, setVisible] = useState(true);

  const NotesContainer = () => {
    return (
      <div className="notes-container">
        <div className="notes-title">Notes</div>
        <div className="note-wrap">
          <Text
            style={{ fontWeight: "bold", margin: ".5em" }}
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
    <Modal
      visible={visible}
      footer={null}
      className="app-modal"
      onCancel={() => setVisible(false)}
    >
      <div className="view-container">
        <MentorAppInfo info={appData} />
        <div className="status-container">
          <MentorAppProgress progress={appData.application_state} />
          <NotesContainer />
        </div>
      </div>
    </Modal>
  );
}

export default MentorApplicationView;
