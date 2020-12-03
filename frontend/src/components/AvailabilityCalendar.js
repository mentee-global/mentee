import React, { useState, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, Button, Badge } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import TextField from "@material-ui/core/TextField";
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

  //TODO: Fill this list with dates in month that have appointments
  const [saved] = useState({});
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  const handleTimeChange = (index, event, num) => {
    const times = [...timeSlots];
    times[index][num] = moment(
      date.format("YYYY-MM-DD") + " " + event.target.value
    );
    setTimeSlots(times);
  }

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
    setDate(value);
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
          <Button
            key="clear"
            type="back"
            onClick={handleClear}
            style={styles.button}
          >
            Clear all
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleOk}
            style={styles.button}
          >
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
            <div className="timeslot-wrapper">
              <TextField
                value={timeSlot[0].format("HH:mm")}
                onChange={(event) => handleTimeChange(index, event, 1)}
                className="timeslot"
                type="time"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300,
                }}
              />
              <h1 className="timeslot"> - </h1>
              <TextField
                value={timeSlot[1].format("HH:mm")}
                onChange={(event) => handleTimeChange(index, event, 2)}
                className="timeslots"
                type="time"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300,
                }}
              />
              <CloseOutlined
                className="close-icon"
                onClick={() => removeTimeSlots(index)}
              />
            </div>
          </Fragment>
        ))}
        <Button
          className="add-times"
          onClick={addTimeSlots}
          style={styles.button}
        >
          Add hours
        </Button>
      </Modal>
    </>
  );
}

const styles = {
  button: {
    backgroundColor: "#E4BB4F",
    borderRadius: 13,
    fontWeight: 700,
    color: "#FFF7E2",
  },
};

export default AvailabilityCalendar;
