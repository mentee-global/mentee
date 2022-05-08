import React, { useState, useEffect, useCallback } from "react";
import { fetchPartners } from "../../utils/api";
import MentorCard from "../MentorCard";
import { Input, Checkbox, Modal, Result, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import MenteeButton from "../MenteeButton";
import "../css/Gallery.scss";
import { isLoggedIn, getMenteeID, getMentorID } from "utils/auth.service";
import { useLocation } from "react-router";
import useAuth from "../../utils/hooks/useAuth";
import PartnerCard from "../PartnerCard";
import { REGIONS } from "utils/consts";

function PartnerGallery() {
	const { isAdmin, isPartner, profileId } = useAuth();
	const [partners, setPartners] = useState([]);
	const [regions, setRegions] = useState([]);
	const [query, setQuery] = useState();
	const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
	const location = useLocation();
	const [pageLoaded, setPageLoaded] = useState(false);

	useEffect(() => {
		async function getPartners() {
			const Partner_data = await fetchPartners();
			if (Partner_data) {
				setPartners(Partner_data);
			}
		}

		getPartners();
	}, []);

	useEffect(() => {
		if (isPartner || isAdmin) {
			setPageLoaded(true);
		}
	}, [isPartner, isAdmin]);

	const getFilterdPartners = () =>
		partners.filter((partner) => {
			// matches<Property> is true if no options selected, or if partner has AT LEAST one of the selected options
			const matchesSpecializations =
				regions.length === 0 ||
				regions.some((s) => partner.regions.indexOf(s) >= 0);
			const matchesName =
				!query ||
				partner.organization.toUpperCase().includes(query.toUpperCase());

			return matchesSpecializations && matchesName;
		});

	// Add some kind of error 403 code
	return !isLoggedIn() ? (
		<Result
			status="403"
			title="403"
			subTitle="Sorry, you are not authorized to access this page."
		/>
	) : (
		<>
			<MenteeButton
				onClick={() => setMobileFilterVisible(true)}
				content="Filter"
				theme="back"
				id="filter-button"
			/>
			<Modal
				onCancel={() => {
					setMobileFilterVisible(false);
				}}
				visible={mobileFilterVisible}
				footer={[
					<MenteeButton
						content="Apply"
						key="apply"
						onClick={() => setMobileFilterVisible(false)}
					/>,
					<MenteeButton
						content="Cancel"
						key="cancel"
						onClick={() => {
							setMobileFilterVisible(false);
							setRegions([]);
							setQuery("");
						}}
					/>,
				]}
			>
				<div className="no-margin gallery-filter-container">
					<div className="gallery-filter-header">Filter By:</div>
					<Input
						placeholder="Search by name"
						prefix={<SearchOutlined />}
						style={styles.searchInput}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<div className="gallery-filter-section-title">regions</div>
					<Checkbox.Group
						defaultValue={regions}
						options={REGIONS}
						onChange={(checked) => setRegions(checked)}
						value={regions}
					/>
				</div>
			</Modal>

			<div className="gallery-container">
				<div className="gallery-filter-container mobile-invisible">
					<div className="gallery-filter-header">Filter By:</div>
					<Input
						placeholder="Search by name"
						prefix={<SearchOutlined />}
						style={styles.searchInput}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<div className="gallery-filter-section-title">regions</div>
					<Checkbox.Group
						defaultValue={regions}
						options={REGIONS}
						onChange={(checked) => setRegions(checked)}
					/>
				</div>

				<div className="gallery-mentor-container">
					{!pageLoaded ? (
						<div className="loadingIcon">
							{" "}
							<Spin />{" "}
						</div>
					) : (
						getFilterdPartners().map((partner, key) => (
							<PartnerCard
								key={key}
								organization={partner.organization}
								email={partner.email}
								location={partner.location}
								regions={partner.regions}
								website={partner.website}
								linkedin={partner.linkedin}
								id={partner._id["$oid"]}
								firebase_uid={partner.firebase_uid}
								image={partner.image}
							/>
						))
					)}
				</div>
			</div>
		</>
	);
}

const styles = {
	searchInput: {
		borderRadius: 10,
		marginBottom: 5,
	},
};

export default PartnerGallery;
