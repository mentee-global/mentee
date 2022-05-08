import React, { useEffect, useState } from "react";
import { List, Button } from "antd";
import { getTrainings, downloadBlob, getTrainVideo } from "utils/api";
import ReactPlayer from "react-player";

import "./css/TrainingList.scss";
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
			.catch((e) => console.log(e));
	}, []);
	return (
		<div className="train_list">
			{loading ? <h1>Loading ...</h1> : ""}
			<List>
				{trainings?.map((train) => (
					<List.Item key={train.id}>
						<h1 className="chapter">{train.name}</h1>
						<p className="trainingDesc">{train.description}</p>
						{train.url ? (
							<ReactPlayer url={train.url} />
						) : (
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
