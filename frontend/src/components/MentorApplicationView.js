import React, { useState, useEffect } from "react";
import { Modal, Typography } from "antd";
import MentorAppInfo from "./MentorAppInfo";
import MentorAppProgress from "./MentorAppProgress";
import { getApplicationById, updateApplicationById } from "../utils/api";
import "./css/MentorApplicationView.scss";
import appData from "../resources/mentorApplication.json";

const { Text } = Typography;

function MentorApplicationView({ data }) {
  const [note, setNote] = useState(null);
  const [appInfo, setAppInfo] = useState({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchAppInfo() {
      const info = await getApplicationById(data.id);
      if (info) {
        setAppInfo(info);
        setNote(info.notes);
      }
    }
    fetchAppInfo();
  }, []);

  /**
   * Once modal closes we update our database with the updated note!
   */
  const handleModalClose = async () => {
    setVisible(false);
    const noteUpdate = {
      notes: note,
    };
    await updateApplicationById(noteUpdate, data.id);
  };

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
      <div
        onClick={() => setVisible(true)}
        style={{
          userSelect: "none",
          padding: 16,
          margin: "0 0 8px 0",
          minHeight: "50px",
          backgroundColor: "white",
          color: "black",
        }}
      >
        {data.content}
      </div>
      <Modal
        visible={visible}
        footer={null}
        className="app-modal"
        onCancel={() => handleModalClose()}
      >
        <div className="view-container">
          <MentorAppInfo info={appInfo} />
          <div className="status-container">
            <NotesContainer />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MentorApplicationView;
