import React, { useState, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, TimePicker, Button, Badge } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";
import "./css/AvailabilityCalendar.scss";

function AvailabilityCalendar() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [saved, setSaved] = useState({
    "11/12/2020": true,
    "12/12/2020": true,
  });
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  const handleTime1Change = (index, event) => {
    const times = [...timeSlots];
    times[index][0] = event;
    setTimeSlots(times);
  };

  const handleTime2Change = (index, event) => {
    const times = [...timeSlots];
    times[index][1] = event;
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    const times = [...timeSlots];
    times.push([moment(), moment()]);
    setTimeSlots(times);
  };

  const removeTimeSlots = (index) => {
    const times = [...timeSlots];
    times.splice(index, 1);
    setTimeSlots(times);
  };

  const onSelect = (value) => {
    setValue(value);
    setVisible(true);
  };

  const handleOk = () => {
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };
  const handleClear = () => {
    setTimeSlots([]);
  };

  const getListData = (value) => {
    if (saved[value.format("DD/MM/YYYY")]) {
      return [{ content: "test" }];
    } else {
      return [];
    }
  };
  const monthCellRender = (value) => {};

  const dateCellRender = (value) => {
    const listData = getListData(value);

    return (
      <ul className="status">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status="success" />
          </li>
        ))}
      </ul>
    );
  };
  return (
    <>
      <Calendar
        value={value}
        onPanelChange={(value) => setValue(value)}
        onSelect={onSelect}
        dateCellRender={dateCellRender}
        monthCellRender={monthCellRender}
      />
      <Modal
        title="Select times for each available session per day"
        visible={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="clear" type="back" onClick={handleClear}>
            Clear all
          </Button>,
          <Button key="save" type="primary" onClick={handleOk}>
            Save
          </Button>,
        ]}
      >
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{days[date.day()]}</h5>
        </div>
        {timeSlots.map((timeSlot, index) => (
          <Fragment key={`${index}`}>
            <div>
              <TimePicker
                value={timeSlot[0]}
                onChange={(event) => handleTime1Change(index, event)}
                className="timeslot"
                format={"HH:mm"}
              />
              <h1 className="timeslot"> - </h1>
              <TimePicker
                value={timeSlot[1]}
                onChange={(event) => handleTime2Change(index, event)}
                className="timeslots"
                format={"HH:mm"}
              />
              <CloseCircleFilled
                className="close-icon"
                onClick={() => removeTimeSlots(index)}
              />
            </div>
          </Fragment>
        ))}
        <Button onClick={addTimeSlots}>Add hours</Button>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
