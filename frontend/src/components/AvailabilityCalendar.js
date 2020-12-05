import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, Button, Badge } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import TextField from "@material-ui/core/TextField";
import MenteeButton from "./MenteeButton.js";
import "./css/AvailabilityCalendar.scss";
import {
  fetchAvailability,
  editAvailability,
  mentorID,
  fetchSetDays,
} from "../utils/api";

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
  const [saved, setSaved] = useState({});
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const format = "YYYY-MM-DDTHH:mm:ss.SSS[Z]";

  useEffect(() => {
    async function getAvailability() {
      const availability_data = await fetchAvailability(mentorID);
      if (availability_data) {
        const availability = availability_data.availability;
        const times = [];
        var i;
        for (i = 0; i < availability.length; i++) {
          times.push([
            moment(availability[i].start_time.$date),
            moment(availability[i].end_time.$date),
          ]);
        }
        setTimeSlots(times);
      }
    }
    getAvailability();
  }, []);
  async function getSetDays() {
    const set_data = await fetchSetDays(mentorID);
    if (set_data) {
      let set = {};
      for (let i = 0; i < set_data.days.length; i++) {
        // console.log(set_data.days[i]);
        set[set_data.days[i]] = true;
      }
      setSaved(set);
    }
  }
  getSetDays();
  const handleTimeChange = (index, event, num) => {
    const times = [...timeSlots];
    times[index][num] = moment(
      date.format("YYYY-MM-DD") + " " + event.target.value
    );
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    const times = [...timeSlots];
    times.push([
      moment(date.format("YYYY-MM-DD")),
      moment(date.format("YYYY-MM-DD")),
    ]);
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
    let json_data = [];
    timeSlots.map((timeSlot) =>
      json_data.push({
        start_time: { $date: timeSlot[0].format(format) },
        end_time: { $date: timeSlot[1].format(format) },
      })
    );
    editAvailability(json_data, mentorID);
    setVisible(false);
    getSetDays(mentorID);
  };

  const handleCancel = () => {
    setVisible(false);
  };
  const handleClear = () => {
    setTimeSlots([]);
  };

  const getListData = (value) => {
    console.log(saved);
    console.log(value.format("YYYY-MM-DD"));
    if (saved[value.format("YYYY-MM-DD")]) {
      return [{ content: "test" }];
    } else {
      return [];
    }
  };

  const getTimeSlots = (day) => {
    let returnSlots = [];
    let i;
    for (i = 0; i < timeSlots.length; i++) {
      if (day === timeSlots[i][0].format("YYYY-MM-DD")) {
        returnSlots.push(timeSlots[i]);
      }
    }
    return returnSlots;
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
          <MenteeButton
            key="clear"
            type="back"
            onClick={handleClear}
            content="Clear all"
          />,
          <MenteeButton
            key="save"
            type="primary"
            onClick={handleOk}
            content="Save"
          />,
        ]}
      >
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{days[date.day()]}</h5>
        </div>
        {getTimeSlots(date.format("YYYY-MM-DD")).map((timeSlot, index) => (
          <Fragment key={`${index}`}>
            <div className="timeslot-wrapper">
              <TextField
                value={timeSlot[0].format("HH:mm")}
                onChange={(event) => handleTimeChange(index, event, 0)}
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
                onChange={(event) => handleTimeChange(index, event, 1)}
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
        <div className="add-times">
          <MenteeButton onClick={addTimeSlots} content="Add hours" />
        </div>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
