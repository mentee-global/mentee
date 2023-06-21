import React, { useEffect, useState } from "react";
import { List, Button } from "antd";
import { getTrainings, downloadBlob, getTrainVideo } from "utils/api";
import ReactPlayer from "react-player/youtube";

import "./css/TrainingList.scss";
import { TRAINING_TYPE } from "utils/consts";
const TrainingList = (props) => {
  const [loading, setLoading] = useState(false);
  const [trainings, setTrainings] = useState(null);
  useEffect(() => {
    setLoading(true);
    getTrainings(props.role)
      .then((trains) => {
        setTrainings(trains);
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, []);
  return (
    <div className="train_list">
      {loading ? <h1>Loading ...</h1> : ""}
      <List>
        {trainings?.map((train) => (
          <List.Item key={train.id}>
            <h1 className="chapter">{train.name}</h1>
            <p className="trainingDesc">{train.description}</p>
            {train.typee === TRAINING_TYPE.VIDEO && (
              <ReactPlayer width={800} height={600} o url={train.url} />
            )}
            {train.typee === TRAINING_TYPE.LINK && (
              <a className="external-link" href={train.url} target="_blank">
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
        ))}
      </List>
    </div>
  );
};

export default TrainingList;
