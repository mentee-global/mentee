import React, { useState, useEffect, Fragment } from "react";
import moment from "moment";
import { Calendar, Modal, Badge, TimePicker } from "antd";
import { CloseOutlined } from "@ant-design/icons";

import MenteeButton from "./MenteeButton.js";
import { useAuth } from "utils/hooks/useAuth";
import { fetchAvailability, editAvailability } from "../utils/api";

import "./css/AvailabilityCalendar.scss";

/**
 * Moment.js documentation: {@link https://momentjs.com/docs/}
 */
function AvailabilityCalendar(props) {
  const { profileId } = useAuth();
  const [saved, setSaved] = useState({}); //  Days with set appointments
  const [value, setValue] = useState(moment());
  const [date, setDate] = useState(moment());
  const [visible, setVisible] = useState(false);
  const [lockmodal, setLockModal] = useState(false); // Locks modal when panel changes
  const [timeSlots, setTimeSlots] = useState([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
  const [trigger, setTrigger] = useState(false); // Trigger for getSetdays UseEffect
  const format = "YYYY-MM-DDTHH:mm:ss.SSSZ";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Gives timezone of browser
  const appointmentdata = props.appointmentdata;

  /**
   * Gets appointments from backend and finds the days in format "YYYY-MM-DD"
   * Changes setDays UseState when trigger variable is changed
   */
  useEffect(() => {
    async function getSetDays() {
      const mentorID = profileId;
      const availability_data = await fetchAvailability(mentorID);
      const set = [];

      if (appointmentdata) {
        appointmentdata.map((appointmentsObject, index) => {
          if (
            !saved.hasOwnProperty(
              moment.parseZone(appointmentsObject.date).local()
            ) &&
            !set.hasOwnProperty(appointmentsObject.date)
          ) {
            // .format strips data to find just year, month, and day
            set[
              moment
                .parseZone(appointmentsObject.date)
                .local()
                .format("YYYY-MM-DD")
            ] = true;
          }
          return false;
        });
      }
      setSaved(set);

      if (availability_data) {
        const availability = availability_data.availability;
        availability.forEach((time) => {
          // Checking if saved or set have date already
          if (
            !saved.hasOwnProperty(
              moment.parseZone(time.start_time.$date).local()
            ) &&
            !set.hasOwnProperty(time.start_time.$date)
          ) {
            // .format strips data to find just year, month, and day
            set[
              moment
                .parseZone(time.start_time.$date)
                .local()
                .format("YYYY-MM-DD")
            ] = true;
          }
        });
      }
      setSaved(set);
    }
    getSetDays();
  }, [trigger]);

  /**
   * Gets availability from backend and changes clientside timeslots
   */
  async function getAvailability() {
    const mentorID = profileId;
    const availability_data = await fetchAvailability(mentorID);

    if (availability_data) {
      const times = [];
      const availability = availability_data.availability;
      availability.forEach((element) => {
        times.push([
          moment.parseZone(element.start_time.$date).local(),
          moment.parseZone(element.end_time.$date).local(),
        ]);
      });
      setTimeSlots(times);
    }
    if (appointmentdata) {
      const bookedTimes = [];
      appointmentdata.map((appointmentsObject, index) => {
        const appointments = appointmentsObject.appointments;
        appointments.forEach((element) => {
          bookedTimes.push([
            moment.parseZone(element.timeslot.start_time.$date).local(),
            moment.parseZone(element.timeslot.end_time.$date).local(),
          ]);
        });
        return false;
      });

      setBookedTimeSlots(bookedTimes);
    }
  }

  /**
   * Handles time changes on textfields
   * @param {int} index Which timeSlot was changed
   * @param {String} event User input values
   * @param {int} timeslot Which of the two textfields was changed
   */
  const handleTimeChange = (index, value, timeslot) => {
    let times = [...timeSlots];
    times[index][timeslot] = moment(value);

    //date.format("YYYY-MM-DD") + " " + value
    setTimeSlots(times);
  };

  const addTimeSlots = () => {
    let times = [...timeSlots];
    var today_booked_slots = getBookedTimeSlots(date.format("YYYY-MM-DD"));
    var today_time_slots = getTimeSlots(date.format("YYYY-MM-DD"));
    if (today_time_slots.length === 0) {
      if (today_booked_slots.length === 0) {
        times.push([
          moment(date.format("YYYY-MM-DD")),
          moment(date.format("YYYY-MM-DD")),
        ]);
      } else {
        times.push([
          moment(
            today_booked_slots[today_booked_slots.length - 1][0][1]
          ).local(),
          moment(
            today_booked_slots[today_booked_slots.length - 1][0][1]
          ).local(),
        ]);
      }
    } else {
      times.push([
        moment(today_time_slots[today_time_slots.length - 1][0][1]).local(),
        moment(today_time_slots[today_time_slots.length - 1][0][1]).local(),
      ]);
    }

    setTimeSlots(times);
  };

  const removeTimeSlots = (index) => {
    let times = [...timeSlots];
    times.splice(index, 1);
    setTimeSlots(times);
  };

  const onPanelChange = (value) => {
    setValue(value);
    setLockModal(true); // Locks modal on panel changes
  };

  /**
   * When a date on calendar is selected open modal
   * @param {String} value Date value from calendar
   */
  const onSelect = (value) => {
    // Workaround that prevents modal from popping up when
    // panels are changed by checking state value of lockmodal
    setLockModal((state) => {
      setDate(value);
      setValue(value);
      getAvailability();
      if (!state) {
        setVisible(true);
      } else {
        setLockModal(false);
      }
      return state;
    });
  };

  const validation = () => {
    var res = true;

    var booked_times = getBookedTimeSlots(date.format("YYYY-MM-DD"));
    var time_slots = getTimeSlots(date.format("YYYY-MM-DD"));
    time_slots.map((time_slot, index) => {
      if (moment(time_slot[0][0]) > moment(time_slot[0][1])) {
        res = false;
        return false;
      }
      booked_times.map((book_time_slot) => {
        if (
          moment(time_slot[0][0]) >= moment(book_time_slot[0][0]) &&
          moment(time_slot[0][0]) < moment(book_time_slot[0][1])
        ) {
          res = false;
          return false;
        }
        if (
          moment(time_slot[0][1]) > moment(book_time_slot[0][0]) &&
          moment(time_slot[0][1]) <= moment(book_time_slot[0][1])
        ) {
          res = false;
          return false;
        }
        return false;
      });
      if (res === false) return true;
      time_slots.map((sub_ime_slot, sub_index) => {
        if (index !== sub_index) {
          if (
            moment(time_slot[0][0]) >= moment(sub_ime_slot[0][0]) &&
            moment(time_slot[0][0]) < moment(sub_ime_slot[0][1])
          ) {
            res = false;
            return false;
          }
          if (
            moment(time_slot[0][1]) > moment(sub_ime_slot[0][0]) &&
            moment(time_slot[0][1]) <= moment(sub_ime_slot[0][1])
          ) {
            res = false;
            return false;
          }
        }
        return false;
      });
      return true;
    });
    return res;
  };

  async function handleOk() {
    document.getElementById("error").style.display = "none";
    if (validation() === false) {
      document.getElementById("error").style.display = "block";
      return;
    }
    let toSend = [];
    // Fills toSend with current timeSlots
    timeSlots.map((timeSlot) =>
      toSend.push({
        start_time: { $date: moment.parseZone(timeSlot[0].format(format)) },
        end_time: { $date: moment.parseZone(timeSlot[1].format(format)) },
      })
    );

    // Sends toSend to backend to update availability
    const mentorID = profileId;
    await editAvailability(toSend, mentorID);

    // Change trigger to update green dots on calendar
    setTrigger(!trigger);
    setVisible(false);
  }

  // Clears set appointments in modal
  const handleClear = () => {
    // Filters timeSlots for appointments on current day
    let cleared = timeSlots.filter(function (value) {
      return !(value[0].format("YYYY-MM-DD") === date.format("YYYY-MM-DD"));
    });
    setTimeSlots(cleared);
  };

  /**
   * Checks if day in calendar has appointments set
   * @param {moment} value moment value of day
   */
  const getListData = (value) => {
    if (saved[value.format("YYYY-MM-DD")]) {
      return [{ content: "Appointment Set" }];
    } else {
      return [];
    }
  };

  /**
   * Gets timeSlots from a certain day for modal
   * @param {String} day Day to get timeSlots from
   * @return {Array} Timeslots from a specific day
   */
  const getTimeSlots = (day) => {
    let returnSlots = [];
    for (let i = 0; i < timeSlots.length; i++) {
      if (day === timeSlots[i][0].format("YYYY-MM-DD")) {
        returnSlots.push([timeSlots[i], i]);
      }
    }
    return returnSlots;
  };

  const getBookedTimeSlots = (day) => {
    let returnSlots = [];
    for (let i = 0; i < bookedTimeSlots.length; i++) {
      if (day === bookedTimeSlots[i][0].format("YYYY-MM-DD")) {
        returnSlots.push([bookedTimeSlots[i], i]);
      }
    }
    return returnSlots;
  };

  /**
   * Renders each cell of calendar
   * @param {moment} value
   * @returns {*} Content of the cell
   */
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
        onPanelChange={onPanelChange}
        onSelect={onSelect}
        dateCellRender={dateCellRender}
      />
      <Modal
        title="Select times for each available session per day"
        visible={visible}
        onCancel={() => setVisible(false)}
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
        <h3 className="hours">
          <b>Hours </b> | <i>{tz.replace("_", " ")}</i>
        </h3>
        <br></br>
        <div className="date-header">
          <h2 className="date">{date && date.format("MM/DD")} </h2>
          <h5 className="date">{date.format("dddd")}</h5>
        </div>
        <div className="all-timeslots-wrapper">
          {getBookedTimeSlots(date.format("YYYY-MM-DD")).map(
            (bookedTimeSlot, index) => (
              <Fragment key={`${index}`}>
                <div className="timeslot-wrapper">
                  <TimePicker
                    format="h:mm A"
                    value={moment(bookedTimeSlot[0][0], "HH:mm")}
                    disabled={true}
                  />
                  <h1 className="timeslot"> - </h1>
                  <TimePicker
                    format="h:mm A"
                    value={moment(bookedTimeSlot[0][1])}
                    disabled={true}
                  />
                </div>
              </Fragment>
            )
          )}
          {getTimeSlots(date.format("YYYY-MM-DD")).map((timeSlot, index) => (
            <Fragment key={`${index}`}>
              <div className="timeslot-wrapper">
                <TimePicker
                  use12Hours={false}
                  format="h:mm A"
                  value={moment(timeSlot[0][0], "HH:mm")}
                  onChange={(event) => handleTimeChange(timeSlot[1], event, 0)}
                  // disabledHours={() => disabledHours(null, timeSlot[0][1], index)}
                  // disabledMinutes={() => disabledMinutes()}
                />
                <h1 className="timeslot"> - </h1>
                <TimePicker
                  use12Hours={false}
                  format="h:mm A"
                  value={moment(timeSlot[0][1])}
                  onChange={(event) => handleTimeChange(timeSlot[1], event, 1)}
                  // disabledHours={() => disabledHours(timeSlot[0][0], null, index)}
                  // disabledMinutes={() => disabledMinutes()}
                />
                <CloseOutlined
                  className="close-icon"
                  onClick={() => removeTimeSlots(timeSlot[1])}
                />
              </div>
            </Fragment>
          ))}
        </div>
        <div className="add-times">
          <p id="error" className="error">
            Invalid Times.Please select times correctly
          </p>
          <MenteeButton onClick={addTimeSlots} content="Add hours" />
        </div>
      </Modal>
    </>
  );
}

export default AvailabilityCalendar;
