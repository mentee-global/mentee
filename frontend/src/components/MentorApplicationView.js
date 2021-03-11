import React from "react";
import { Modal } from "antd";
import MentorAppInfo from "./MentorAppInfo";
import "./css/MentorApplicationView.scss";
import appData from "../resources/mentorApplication.json";

function MentorApplicationView({ data }) {
  return (
    <Modal visible footer={null} className="app-modal">
      <div className="view-container">
        <MentorAppInfo info={appData} />
        <div className="status-container">This is the right side</div>
      </div>
    </Modal>
  );
}

export default MentorApplicationView;
