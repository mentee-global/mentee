import React, { useState, useEffect } from "react";
import { Modal, Typography } from "antd";
import MentorAppInfo from "./MentorAppInfo";
import MentorAppProgress from "./MentorAppProgress";
import { getApplicationById, updateApplicationById } from "../utils/api";
import "./css/MentorApplicationView.scss";
import { NEW_APPLICATION_STATUS } from "utils/consts";
import ModalInput from "./ModalInput";
import NewMentorAppInfo from "./NewMentorAppInfo";
import MenteeAppInfo from "./MenteeAppInfo";
const { Text } = Typography;

function MentorApplicationView({ id, isMentor, isNew, appInfo }) {
  const [appstate, setAppstate] = useState(appInfo.application_state);
  const [note, setNote] = useState(appInfo.notes);

  /**
   * Once modal closes we update our database with the updated note!
   */
  useEffect(() => {
    setAppstate(appInfo.application_state);
    setNote(appInfo.notes);
  }, [appInfo]);
  const NotesContainer = () => {
    return (
      <div className="notes-container">
        <MentorAppProgress progress={appstate} />
        <ModalInput
          style={styles.modalInput}
          type="dropdown-single"
          title={""}
          onChange={async (e) => {
            const dataa = {
              application_state: e,
            };
            await updateApplicationById(dataa, id, isMentor);
            setAppstate(e);
          }}
          options={[
            NEW_APPLICATION_STATUS.PENDING,
            NEW_APPLICATION_STATUS.APPROVED,
            NEW_APPLICATION_STATUS.BUILDPROFILE,
            NEW_APPLICATION_STATUS.COMPLETED,
            NEW_APPLICATION_STATUS.REJECTED,
          ]}
          value={appstate}
          handleClick={() => {}}
        />
        <div className="notes-title">Notes</div>
        <div className="note-wrap">
          <Text
            style={{ fontWeight: "bold" }}
            editable={{
              onChange: async (value) => {
                const noteUpdate = {
                  notes: value,
                };
                setNote(value);
                await updateApplicationById(noteUpdate, id, isMentor);
              },
              tooltip: "Click to edit note",
            }}
          >
            {note}
          </Text>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="view-container">
        {!isMentor && <MenteeAppInfo info={appInfo} />}
        {isNew && isMentor && <NewMentorAppInfo info={appInfo} />}
        {!isNew && isMentor && <MentorAppInfo info={appInfo} />}

        <div className="status-container">
          <NotesContainer />
        </div>
      </div>
    </div>
  );
}
const styles = {
  modalInput: {
    height: 65,
    margin: 18,
    padding: 4,
    paddingTop: 6,
    marginBottom: "40px",
  },
};
export default MentorApplicationView;
