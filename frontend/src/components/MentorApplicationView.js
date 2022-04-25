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

function MentorApplicationView({ data, handleApp, isMentor, isNew }) {
	const [note, setNote] = useState(null);
	const [appInfo, setAppInfo] = useState({});
	const [visible, setVisible] = useState(false);
	const [appstate, setAppstate] = useState(null);

	useEffect(() => {
		async function fetchAppInfo() {
			const info = await getApplicationById(data.id, isMentor);
			if (info) {
				setAppInfo(info);
				setNote(info.notes);
				setAppstate(info.application_state);
			}
		}
		fetchAppInfo();
	}, [visible]);

	/**
	 * Once modal closes we update our database with the updated note!
	 */
	const handleModalClose = async () => {
		setVisible(false);
		const noteUpdate = {
			notes: note,
		};
		await updateApplicationById(noteUpdate, data.id, isMentor);
	};

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
						await updateApplicationById(dataa, data.id, isMentor);
						setAppstate(e);
						handleApp();
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
							onChange: setNote,
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
			<div
				onClick={() => setVisible(true)}
				style={{
					userSelect: "none",
					padding: 16,
					margin: "0 0 8px 0",
					minHeight: "50px",
					backgroundColor: "white",
					color: "black",
				}}
			>
				{data.content.name}
				<br></br>
				{data.content.email}
			</div>
			<Modal
				visible={visible}
				footer={null}
				className="app-modal"
				onCancel={() => handleModalClose()}
			>
				<div className="view-container">
					{!isMentor && <MenteeAppInfo info={appInfo} />}
					{isNew && isMentor && <NewMentorAppInfo info={appInfo} />}
					{!isNew && isMentor && <MentorAppInfo info={appInfo} />}

					<div className="status-container">
						<NotesContainer />
					</div>
				</div>
			</Modal>
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
