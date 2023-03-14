import React, { useState } from "react";
import { Button, Modal } from "antd";
import ModalInput from "./ModalInput";
import { SPECIALIZATIONS } from "../utils/consts";
import { editMenteeProfile } from "../utils/api";
import { getMenteeID } from "../utils/auth.service";
import { useHistory } from "react-router";
import "./css/MenteeAppointments.scss";
import { useEffect } from "react";

function MenteeProfileModal(props) {
  const history = useHistory();
  const [modalVisible, setModalVisible] = useState(true);
  const [error, setError] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [specMasters, setSpecMasters] = useState([]);

  useEffect(() => {
    async function getMasters() {
      setSpecMasters(await SPECIALIZATIONS());
    }
    getMasters();
  }, []);

  function handleSpecializationsChange(e) {
    let specializationsSelected = [];
    e.forEach((value) => specializationsSelected.push(value));
    setSpecializations(specializationsSelected);
  }
  const handleSaveEdits = () => {
    async function saveEdits(data) {
      const menteeID = await getMenteeID();
      await editMenteeProfile(data, menteeID);
      setModalVisible(false);
    }
    if (!specializations || specializations.length <= 0) {
      setError(true);
      return;
    }
    const updatedProfile = {
      specializations: specializations,
    };
    saveEdits(updatedProfile).then(() => {
      history.go(0);
    });
  };

  return (
    <span>
      <Modal
        title="Please Update your interests"
        visible={modalVisible}
        onCancel={() => {}}
        style={{ overflow: "hidden" }}
        bodyStyle={{ height: "30vh !important" }}
        closable={false}
        footer={
          <div>
            {error && (
              <b style={styles.alertToast}>
                Please Choose one interest at least
              </b>
            )}
            <Button
              type="default"
              shape="round"
              style={styles.footer}
              onClick={handleSaveEdits}
            >
              Save
            </Button>
          </div>
        }
        className="modal-window interest-modal"
      >
        <div className="modal-container">
          <div className="modal-inner-container">
            <div className="modal-input-container">
              <ModalInput
                style={styles.modalInput}
                type="dropdown-multiple"
                title="Areas of interest"
                index={99}
                onChange={handleSpecializationsChange}
                options={specMasters}
                value={specializations}
                handleClick={() => {}}
              />
            </div>
          </div>
        </div>
      </Modal>
    </span>
  );
}

const styles = {
  modalInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
  },
  footer: {
    borderRadius: 13,
    marginRight: 15,
    backgroundColor: "#E4BB4F",
  },
  alertToast: {
    color: "#FF0000",
    display: "inline-block",
    marginRight: 10,
  },
};

export default MenteeProfileModal;
