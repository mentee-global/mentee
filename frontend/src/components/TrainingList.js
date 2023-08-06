import React, { useEffect, useState } from "react";
import { List, Button, Typography, Skeleton } from "antd";
import { getTrainings, downloadBlob, getTrainVideo } from "utils/api";
import ReactPlayer from "react-player/youtube";

import "./css/TrainingList.scss";
import { I18N_LANGUAGES, TRAINING_TYPE } from "utils/consts";
import { useTranslation } from "react-i18next";

const placeholder = Array(5).fill({
  _id: {
    $oid: "Lorem ipsum dolor sit amet",
  },
  description: "Mentee Handbook first trainingg",
  file_name: "Mentee_Handbook.pdf",
  name: "Mentee Handbook",
  role: "2",
  typee: "LINK",
  url: "https://4x.ant.design/components/form/#API",
});

const getTrainingComponent = (training) => {
  switch (training.typee) {
    case TRAINING_TYPE.VIDEO:
      return (
        <ReactPlayer
          className="react-player"
          width={400}
          height={300}
          url={training.url}
        />
      );
    case TRAINING_TYPE.LINK:
      return (
        <a className="external-link" href={training.url} target="_blank">
          {training.url}
        </a>
      );
    case TRAINING_TYPE.DOCUMENT:
      return (
        <Button
          onClick={async () => {
            let response = await getTrainVideo(training.id);
            downloadBlob(response, training.file_name);
          }}
        >
          {training.file_name}
        </Button>
      );
    default:
      return null;
  }
};

const TrainingList = (props) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [trainingData, setTrainingData] = useState();

  useEffect(() => {
    setLoading(true);
    getTrainings(props.role)
      .then((trains) => {
        setTrainingData(trains);
        setLoading(false);
      })
      .catch((e) => console.error(e));
  }, [i18n.language]);
  return (
    <List
      itemLayout="vertical"
      size="large"
      dataSource={trainingData ?? placeholder}
      renderItem={(item) => (
        <List.Item key={item._id.$oid}>
          <Skeleton loading={loading} active>
            <List.Item.Meta title={item.name} description={item.description} />
            {getTrainingComponent(item)}
          </Skeleton>
        </List.Item>
      )}
    />
  );
};

export default TrainingList;
