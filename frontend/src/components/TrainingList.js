import React, { useEffect, useState } from "react";
import { List } from "antd";
import { getTrainings } from "utils/api";
import "./css/TrainingList.scss";
const TrainingList = () => {
	const [loading, setLoading] = useState(false);
	const [trainings, setTrainings] = useState(null);
	useEffect(() => {
		setLoading(true);
		getTrainings()
			.then((trains) => {
				setTrainings(trains);
				setLoading(false);
			})
			.catch((e) => console.log(e));
	}, []);
	return (
		<div>
			{loading ? <h1>Loading ...</h1> : ""}
			<List>
				{trainings?.map((train) => (
					<List.Item key={train.id}>
						<a href={train.url} target="_blank">
							<h1>{train.name}</h1>
						</a>
						<p className="trainingDesc">
							{train.description} Lorem ipsum dolor sit amet consectetur
							adipisicing elit. Deserunt, vitae ut, cum amet itaque impedit
							aliquam quia inventore labore adipisci at sed perferendis
							recusandae repellendus. Sit quaerat rerum tempora dignissimos!
						</p>
					</List.Item>
				))}
			</List>
		</div>
	);
};

export default TrainingList;
