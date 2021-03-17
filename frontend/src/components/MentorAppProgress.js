import React, { useState, useEffect } from "react";
import "./css/MentorApplicationView.scss";

function MentorAppProgress({ progress }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    let newStatus = {};
    switch (progress) {
      case "Pending":
        newStatus["style"] = { background: "#DADADA" };
        break;
      case "Reviewed":
        newStatus["style"] = { background: "#FFDB6F" };
        break;
      case "Rejected":
        newStatus["style"] = { background: "#B15858" };
        break;
      case "Offer":
        newStatus["style"] = { background: "#6FCF97" };
        break;
      default:
        newStatus["style"] = { background: "#DADADA" };
        break;
    }
    newStatus["text"] = progress + (progress == "Offer" ? " Made" : "");
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
