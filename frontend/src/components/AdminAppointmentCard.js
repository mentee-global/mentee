import React, { useState, useEffect } from "react";
import {
  StarOutlined,
  ClockCircleTwoTone,
  CheckCircleTwoTone,
  QuestionCircleTwoTone,
} from "@ant-design/icons";
import moment from "moment";
import AdminAppointmentModal from "./AdminAppointmentModal";
import "./css/AdminAppointments.scss";

function AdminAppointmentCard({ data, onReset }) {
  const [visible, setVisible] = useState(false);
  const [dateFormat, setDateFormat] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => {
    if (!data) {
      return null;
    }
    const startTime = moment(data.appointment.timeslot.start_time.$date);
    const endTime = moment(data.appointment.timeslot.end_time.$date);
    setDateFormat({
      date: startTime.format("dddd, MMMM D, YYYY"),
      time: `${startTime.format("hh:mm a")} - ${endTime.format("hh:mm a")}`,
    });

    const now = moment();

    if (now.isAfter(endTime)) {
      setStatus({
        text: "past",
        icon: <ClockCircleTwoTone />,
      });
    } else if (data.accepted) {
      setStatus({
        text: "upcoming",
        icon: <CheckCircleTwoTone twoToneColor="green" />,
      });
    } else {
      setStatus({
        text: "pending",
        icon: <QuestionCircleTwoTone twoToneColor="#F8D15B" />,
      });
    }
  }, [onReset]);

  return (
    <div className="card-container" onClick={() => setVisible(!visible)}>
      <AdminAppointmentModal visible={visible} />
      <div className="card-header">
        <div className="card-date">
          <div>{dateFormat && dateFormat.date}</div>
          <div>{dateFormat && dateFormat.time}</div>
        </div>
        <div className="card-status">
          {status && `${status.text} `}
          {status && status.icon}
        </div>
      </div>
      <div className="card-mentor">
        <div style={{ fontSize: ".9em", color: "#7A7A7A" }}>Mentor</div>
        <b>{data.mentor}</b>
      </div>
      <div className="card-mentee">
        <div style={{ fontSize: ".9em", color: "#7A7A7A" }}>Mentee</div>
        <b>{data.appointment.name}</b>
      </div>
      <div className="card-topic">
        <div>
          <StarOutlined /> Meeting Topic:
        </div>
        <div>
          {data &&
            data.appointment.specialist_categories.map((category, i) => {
              return i < data.appointment.specialist_categories.length - 1
                ? `${category}, `
                : category;
            })}
        </div>
      </div>
    </div>
  );
}

export default AdminAppointmentCard;
