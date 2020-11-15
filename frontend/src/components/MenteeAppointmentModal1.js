import React, { useState } from "react";
import { Button, Modal, Checkbox, Avatar } from "antd";
import ModalInput from "./ModalInput";
import { UserOutlined, EditFilled, PlusCircleFilled } from "@ant-design/icons";
import { LANGUAGES, SPECIALIZATIONS } from "../utils/consts";
import "./css/AntDesign.scss";
import "./css/Modal.scss";
import "./css/MenteeModal.scss"

function MenteeAppointmentModal1() {
    const [modalVisible, setModalVisible] = useState(false);
    const [numInputs, setNumInputs] = useState(14);
    const [inputClicked, setInputClicked] = useState(
        new Array(numInputs).fill(false)
    ); // each index represents an input box, respectively
    const [name, setName] = useState(null);
    const [title, setTitle] = useState(null);
    const [about, setAbout] = useState(null);
    const [inPersonAvailable, setInPersonAvailable] = useState(null);
    const [groupAvailable, setGroupAvailable] = useState(null);
    const [location, setLocation] = useState(null);
    const [website, setWebsite] = useState(null);
    const [languages, setLanguages] = useState(null);
    const [linkedin, setLinkedin] = useState(null);
    const [specializations, setSpecializations] = useState(null);
    const [school, setSchool] = useState(null);
    const [graduation, setGraduation] = useState(null);
    const [majors, setMajors] = useState(null);
    const [degree, setDegree] = useState(null);

    function handleClick(index) {
        // Sets only the clicked input box to true to change color, else false
        let newClickedInput = new Array(numInputs).fill(false);
        newClickedInput[index] = true;
        setInputClicked(newClickedInput);
    }


    function handleLanguageChange(e) {
        let languagesSelected = [];
        e.forEach((value) => languagesSelected.push(LANGUAGES[value]));
        setLanguages(languagesSelected);
    }

    function handleLinkedinChange(e) {
        setLinkedin(e.target.value);
    }

    function handleSpecializationsChange(e) {
        let specializationsSelected = [];
        e.forEach((value) => specializationsSelected.push(SPECIALIZATIONS[value]));
        setLanguages(specializationsSelected);
    }

    return (
        <div>
            <Button
                style={{ background: "#E4BB4F", color: "white" }}
                className="mentor-profile-edit-button"
                onClick={() => setModalVisible(true)}
            >
                Book Appointment
      </Button>
            <Modal
                title="Your Information"
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                width="50%"
                style={{ overflow: "hidden" }}
                footer={
                    <Button
                        type="default"
                        shape="round"
                        style={styles.footer}
                        onClick={() => setModalVisible(false)}
                    >
                        Book Appointment
          </Button>
                }
            >
                <div className="modal-container">
                    <div className="modal-mentee-appointment-heading-container">
                        <div className="modal-mentee-appointment-heading-text"> Mentoring Session with Bernie Sanders </div>
                        <div className="modal-mentee-appointment-heading-divider" />
                        <div className="modal-mentee-appointment-heading-date-container">
                            <div className="modal-mentee-appointment-heading-date"> 10/6 </div>
                            <div className="modal-mentee-appointment-heading-day"> Tuesday </div>
                        </div>
                    </div>
                    <div className="modal-inner-container">
                        <div className="flex flex-row">
                            <div className="modal-mentee-appointment-col-container">
                                <div className="modal-mentee-appointment-header-text"> About You </div>
                                <ModalInput
                                    height={65}
                                    type="text"
                                    title="Name"
                                    clicked={inputClicked[5]}
                                    index={5}
                                    handleClick={handleClick}
                                    onChange={handleLinkedinChange}
                                ></ModalInput>
                                <ModalInput
                                    height={65}
                                    type="text"
                                    title="Location"
                                    clicked={inputClicked[5]}
                                    index={5}
                                    handleClick={handleClick}
                                    onChange={handleLinkedinChange}
                                ></ModalInput>
                                <ModalInput
                                    height={65}
                                    type="text"
                                    title="Location"
                                    clicked={inputClicked[5]}
                                    index={5}
                                    handleClick={handleClick}
                                    onChange={handleLinkedinChange}
                                ></ModalInput>
                            </div>
                            <div className="modal-mentee-appointment-col-container">
                                <div className="modal-mentee-appointment-header-text"> Contact Information </div>

                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

const styles = {
    footer: {
        borderRadius: 13,
        marginRight: 15,
        backgroundColor: "#E4BB4F",
    },
};

export default MenteeAppointmentModal1;
