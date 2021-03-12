import React from "react";
import "./css/MentorApplicationView.scss";

function MentorAppProgress({ progress }) {
  const progStates = {
    pending: progress === "Pending",
    reviewed: progress === "Reviewed",
    offer: progress === "Offer",
    rejected: progress === "Rejected",
  };

  return (
    <div className="progress-container">
      <div style={{ width: "25%", textAlign: "center" }}>
        <div className="progress-title">PENDING</div>
        <div
          className={"progress-section " + (progStates.pending && "selected")}
          style={{ borderRadius: "20px 0px 0px 20px" }}
        />
      </div>
      <div style={{ width: "25%", textAlign: "center" }}>
        <div className="progress-title">REVIEWED</div>
        <div
          className={"progress-section " + (progStates.reviewed && "selected")}
        />
      </div>
      <div style={{ width: "25%", textAlign: "center" }}>
        <div className="progress-title">OFFER MADE</div>
        <div
          className={"progress-section " + (progStates.offer && "selected")}
        />
      </div>
      <div style={{ width: "25%", textAlign: "center" }}>
        <div className="progress-title">REJECTED</div>
        <div
          className={"progress-section " + (progStates.rejected && "selected")}
          style={{ borderRadius: "0px 20px 20px 0px" }}
        />
      </div>
    </div>
  );
}

export default MentorAppProgress;
