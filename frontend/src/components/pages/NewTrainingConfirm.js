import React, { useEffect, useState } from "react";
import { getTrainById, getTrainVideo, downloadBlob } from "../../utils/api";
import { List, Button } from "antd";
import ReactPlayer from "react-player/youtube";
import { TRAINING_TYPE } from "utils/consts";
import "../css/TrainingList.scss";

function NewTrainingConfirm({ accountType, id }) {
  const [train, setTrain] = useState({});
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    async function getNewTraining() {
      const record = await getTrainById(id);
      if (record) {
        setTrain(record);
        setLoading(false);
      }
    }
    getNewTraining();
  }, [id]);
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
                  <Button
                    onClick={async () => {
                      let response = await getTrainVideo(train.id);
                      downloadBlob(response, train.file_name);
                    }}
                  >
                    {train.file_name}
                  </Button>
                )}
              </List.Item>
            )}
          </List>
        </div>
        <div className="btnContainer">
          <div
            className={`applySubmit2`}
            onClick={async () => {
              window.location.href = "/";
            }}
          >
            I confirm I have completed the training.
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTrainingConfirm;
