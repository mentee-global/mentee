import React, { useState } from "react";
import { Button, Modal } from "antd";
import {
    EnvironmentOutlined,
    CommentOutlined,
} from "@ant-design/icons";

import {
    acceptAppointment,
    deleteAppointment,
} from "./../utils/api";


import "./css/Appointments.scss";

function AppointmentInfo(props) {
    const [appointmentClick, setAppointmentClick] = useState(true);

    //const [modalVisible, setModalVisible] = useState(false);

    const getLanguages = (languages) => {
        return languages.join(" • ");
    };
    
    const getCategories = (specialist_categories) => {
        return specialist_categories.join(", ");
    };
    
    const getSubtext = (gender, ethnicity, organization) => {
        var subtextInfo = [gender, ethnicity];
        if (organization != undefined) {
          subtextInfo.push(organization);
        }
        return subtextInfo.join(" • ");
    };
    
    async function handleAppointmentClick(id, didAccept) {
        if (didAccept) {
          await acceptAppointment(id);
        } else {
          await deleteAppointment(id);
        }
        setAppointmentClick(!appointmentClick);
    }



    return (
        <Modal
            visible={props.modalVisible}
            title="Appointment Details"
            width="449.91px"
            onCancel={() => props.setModalVisible(false)}
            footer={
            <div className = "ar-footer">
                <Button 
                className="accept-apt" 
                onClick={() => handleAppointmentClick(props.id, true)}>
                Accept
                </Button>
                <Button 
                className="reject-apt" 
                onClick={() => handleAppointmentClick(props.id, false)}>
                Reject
                </Button>
            </div>
            }
        >
            <div className="ar-modal-container">
            <div className="ar-status">pending<span class="dot"></span></div>
            <div className="ar-modal-title">{props.name}, {props.age}</div>
            <div className="ar-phone">Call/text: {props.phone_number}</div>
            <div className="ar-email">{props.email}</div>
            <div className="ar-title-subtext">{getSubtext(props.gender, props.ethnicity, props.organization)}</div>
            <div>
                <div className="ar-languages"><CommentOutlined className="ar-icon"></CommentOutlined>{getLanguages(props.languages || [])}</div>
                <div className="ar-location"><EnvironmentOutlined className="ar-icon"></EnvironmentOutlined>{props.location}</div>
            </div>
            <div className="ar-apt-date">{props.date}</div>
            <div className="ar-apt-time">{props.time}</div>
            <div className="ar-categories-title">Seeking help in:</div>
            <div className="ar-categories">{getCategories(props.specialist_categories || [])}</div>  
            <div className="ar-goals-title">Note:</div>
            <div className="ar-goals">{props.description}</div>
            <div className="vl"></div>
            <div className="hl"></div>
            </div>
        </Modal>
    );
}

export default AppointmentInfo;