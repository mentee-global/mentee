import React, { useState } from "react";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";
import ModalInput from "./ModalInput";
import { editMenteeProfile } from "utils/api";
import { useAuth } from "utils/hooks/useAuth";
import { useHistory } from "react-router";
import "./css/MenteeAppointments.scss";
import { useSelector } from "react-redux";

function MenteeProfileModal(props) {
  const history = useHistory();
  const { profileId } = useAuth();
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  const [modalVisible, setModalVisible] = useState(true);
  const [error, setError] = useState(false);
  const [specializations, setSpecializations] = useState([]);

  function handleSpecializationsChange(e) {
    let specializationsSelected = [];
    e.forEach((value) => specializationsSelected.push(value));
    setSpecializations(specializationsSelected);
  }
  const handleSaveEdits = () => {
    async function saveEdits(data) {
      const menteeID = profileId;
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
        title={t("menteeInterestsModal.title")}
        open={modalVisible}
        onCancel={() => {}}
        style={{ overflow: "hidden" }}
        bodyStyle={{ height: "30vh !important" }}
        closable={false}
        footer={
          <div>
            {error && (
              <b style={styles.alertToast}>{t("menteeInterestsModal.error")}</b>
            )}
            <Button
              type="default"
              shape="round"
              style={styles.footer}
              onClick={handleSaveEdits}
            >
              {t("common.save")}
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
                title={t("menteeInterestsModal.interestsTitle")}
                index={99}
                onChange={handleSpecializationsChange}
                options={options.specializations}
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
