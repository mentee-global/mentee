import React, { useState, useEffect } from "react";
import { Select, Input, InputNumber } from "antd";
import "./css/Modal.scss";
import { NodeExpandOutlined } from "@ant-design/icons";

const { Option } = Select;

function ModalInput(props) {
	const {
		clicked,
		index,
		educationIndex,
		hasBorder = true,
		onEducationChange,
		maxRows,
		type,
		title,
		placeholder,
		options,
		onChange,
		handleClick,
		defaultValue,
		valid,
		validate,
		large,
		errorPresent,
		errorMessage,
	} = props;
	const [isClicked, setIsClicked] = useState(clicked);

	useEffect(() => {
		setIsClicked(clicked);
	}, [clicked]);

	function handleOnChange(e) {
		if (!onEducationChange) {
			onChange(e);
		} else {
			onEducationChange(e, educationIndex);
		}
		handleClick(index);
	}

	function getContainerStyle() {
		let style = {
			...styles.container,
			...props.style,
		};

		if (type === "textarea") {
			style = {
				...styles.textAreaContainer,
				...props.style,
			};
		}

		if (hasBorder) {
			style = {
				...style,
				...styles.border,
			};
		}

		if (isClicked && valid) {
			style = {
				...style,
				...styles.clicked,
			};
		} else if (validate && !valid) {
			style = {
				...style,
				...styles.invalid,
			};
		}

		return style;
	}

	function getTextStyle() {
		let style = styles.text;

		if (isClicked) {
			style = {
				...style,
				...styles.clicked,
			};
		}

		return style;
	}

	const returnDropdownItems = (items) => {
		let options = [];
		for (let i = 0; i < items.length; i++) {
			options.push(<Option key={items[i]}>{items[i]}</Option>);
		}
		return options;
	};

	const InputBox = () => {
		switch (type) {
			case "text":
				return (
					<div>
						<Input
							className="input-text"
							onClick={() => handleClick(index)}
							onChange={handleOnChange}
							bordered={false}
							placeholder={placeholder}
							value={props.value}
							defaultValue={defaultValue}
						/>
						{errorPresent && <p className="input-error">{errorMessage}</p>}
					</div>
				);
			case "password":
				return (
					<div>
						<Input
							type="password"
							className="input-text"
							onClick={() => handleClick(index)}
							onChange={handleOnChange}
							bordered={false}
							placeholder={placeholder}
							value={props.value}
						/>
						{errorPresent && <p className="input-error">{errorMessage}</p>}
					</div>
				);
			case "dropdown-single":
				return (
					<div>
						<Select
							className="input-text"
							onClick={() => handleClick(index)}
							allowClear
							bordered={false}
							style={{ width: "100%" }}
							placeholder="Please select"
							onChange={handleOnChange}
							value={props.value}
							defaultValue={defaultValue}
						>
							{returnDropdownItems(options)}
						</Select>
						{errorPresent && <p className="input-error">{errorMessage}</p>}
					</div>
				);
			case "dropdown-multiple":
				return (
					<div>
						<Select
							className="input-text"
							onClick={() => handleClick(index)}
							mode={onEducationChange ? "tags" : "multiple"}
							allowClear
							bordered={false}
							style={{ width: "100%" }}
							placeholder={placeholder || "Please select"}
							onChange={handleOnChange}
							value={props.value}
							tokenSeparators={[","]}
							defaultValue={defaultValue}
						>
							{returnDropdownItems(options)}
						</Select>
						{errorPresent && <p className="input-error">{errorMessage}</p>}
					</div>
				);
			case "textarea":
				return (
					<div>
						<Input.TextArea
							className={"input-textarea" + (large ? " large-textarea" : "")}
							autoSize={{ maxRows: maxRows ?? 1 }}
							onClick={() => handleClick(index)}
							onChange={handleOnChange}
							bordered={false}
							placeholder={placeholder}
							value={props.value}
							defaultValue={defaultValue}
						/>
						{errorPresent && <p className="input-error">{errorMessage}</p>}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div style={getContainerStyle()}>
			<div style={getTextStyle()}>{title}</div>
			{InputBox()}
		</div>
	);
}

const styles = {
	container: {
		flex: 1,
		flexDirection: "column",
		width: "100%",
		backgroundColor: "#FFFDF5",
	},
	textAreaContainer: {
		flex: 1,
		flexDirection: "column",
		width: "100%",
	},
	border: {
		borderBottomStyle: "solid",
		borderBottomWidth: 3,
		borderColor: "#828282",
	},
	text: {
		flex: 1,
		fontWeight: "bold",
		color: "#828282",
		paddingLeft: 11,
		backgroundColor: "#FFFDF5",
	},
	clicked: {
		color: "#F2C94C",
		borderColor: "#F2C94C",
	},
	invalid: {
		color: "#FF0000",
		borderColor: "#FF0000",
	},
};

export default ModalInput;
