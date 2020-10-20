import React from "react";

import { Calendar, Divider } from "antd";
import "antd/dist/antd.css";
import "./css/MentorCalendar.scss";


const [date, setDate] = useState(null);

function MentorCalendar() {
    

    return (
        <div className="mentor-portal-calendar">
            <Calendar value = {value} fullscreen={false} onSelect={() => setDate(value)}/>
            <div className="view-events">
                <h2>{ date }</h2>
            </div>
        </div>
    )

}

export default MentorCalendar;