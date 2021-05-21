import React, { useState, useEffect } from "react";
import "./css/MentorApplicationView.scss";
import { APP_STATUS } from "../utils/consts";

function MentorAppProgress({ progress }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    let newStatus = {};
    switch (progress) {
      case APP_STATUS.PENDING:
        newStatus["style"] = { background: "#DADADA" };
        break;
      case APP_STATUS.REVIEWED:
        newStatus["style"] = { background: "#FFDB6F" };
        break;
      case APP_STATUS.REJECTED:
        newStatus["style"] = { background: "#B15858" };
        break;
      case APP_STATUS.OFFER_MADE:
        newStatus["style"] = { background: "#6FCF97" };
        break;
      default:
        newStatus["style"] = { background: "#DADADA" };
        break;
    }
    newStatus["text"] = progress;
    setStatus(newStatus);
  }, []);

  return (
    <div className="progress-container">
      <div className="progress-section" style={status.style ?? {}}>
        {status.text}
      </div>
    </div>
  );
}

export default MentorAppProgress;
