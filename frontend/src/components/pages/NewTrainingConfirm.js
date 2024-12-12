import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import {
  getTrainById,
  getTrainVideo,
  downloadBlob,
  getSignedDocfile,
} from "../../utils/api";
import { List, Button } from "antd";
import ReactPlayer from "react-player/youtube";
import { TRAINING_TYPE } from "utils/consts";
import "../css/TrainingList.scss";
import { useSelector } from "react-redux";
import DigitalSignModal from "../DigitalSignModal";

// TODO: Finish trasnlating this confirm
function NewTrainingConfirm({ match }) {
  const [train, setTrain] = useState({});
  const [loading, setLoading] = useState(false);
  const id = match.params.id;
  const [openSignModal, setOpenSignModal] = useState(false);
  const [selectedTrainid, setSelectedTrainid] = useState(null);
  const [reload, setReload] = useState(false);
  const { user } = useSelector((state) => state.user);
  useEffect(() => {
    setLoading(true);
    async function getNewTraining() {
      const record = await getTrainById(id, user ? user.email : null);
      if (record) {
        setTrain(record);
        setLoading(false);
      }
    }
    getNewTraining();
  }, [id, reload]);
  return (
    <div className="">
      <h1 className="new-train-header">MENTEE Required New Trainings</h1>
      <p className="new-train-text">
        Thank you for your time to further develop your skills and contribute to
        our community!
        <br /> Please complete these new training before the end of next month.
      </p>
      <div className="trainpart">
        <div className="train_list">
          {loading ? <h1>Loading ...</h1> : ""}
          <List>
            {train._id && (
              <List.Item key={id}>
                <h1 className="chapter">{train.name}</h1>
                <p className="trainingDesc">{train.description}</p>
                {train.typee === TRAINING_TYPE.VIDEO && (
                  <ReactPlayer width={800} height={600} o url={train.url} />
                )}
                {train.typee === TRAINING_TYPE.LINK && (
                  <a
                    className="external-link"
                    href={train.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {train.url}
                  </a>
                )}
                {train.typee === TRAINING_TYPE.DOCUMENT && (
                  <>
                    {train.requried_sign &&
                    (!train.signed_data ||
                      !train.signed_data[train._id.$oid]) ? (
                      <Button
                        type="primary"
                        onClick={() => {
                          setOpenSignModal(true);
                          setSelectedTrainid(train._id.$oid);
                        }}
                      >
                        Sign
                      </Button>
                    ) : (
                      <Button
                        onClick={async () => {
                          let response = null;
                          if (train.signed_data[train._id.$oid]) {
                            response = await getSignedDocfile(
                              train.signed_data[train._id.$oid].$oid
                            );
                          } else {
                            response = await getTrainVideo(
                              train.id ? train.id : train._id.$oid
                            );
                          }
                          downloadBlob(response, train.file_name);
                        }}
                      >
                        {train.file_name}
                      </Button>
                    )}
                  </>
                )}
              </List.Item>
            )}
          </List>
        </div>
        <div className="btnContainer" style={{ justifyContent: "center" }}>
          {train.typee === TRAINING_TYPE.DOCUMENT &&
          train.requried_sign &&
          (!train.signed_data || !train.signed_data[train._id.$oid]) ? (
            <></>
          ) : (
            <div
              className={`applySubmit2`}
              onClick={async () => {
                window.location.href = "/";
              }}
            >
              I confirm I have completed the training.
            </div>
          )}
        </div>
      </div>
      <DigitalSignModal
        role={user ? user.role : null}
        email={user ? user.email : null}
        train_id={selectedTrainid}
        open={openSignModal}
        finish={() => {
          setReload(!reload);
          setOpenSignModal(false);
          setSelectedTrainid(null);
        }}
      />
    </div>
  );
}

export default withRouter(NewTrainingConfirm);
