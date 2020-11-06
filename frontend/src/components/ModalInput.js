import React, { useState, useEffect } from "react";
import { Select, Input } from "antd";
import "./css/Modal.scss";

const { Option } = Select;

function ModalInput(props) {
    const [isClicked, setIsClicked] = useState(props.clicked)

    useEffect(() => {
        setIsClicked(props.clicked)
    }, [props.clicked]);

    function handleOnChange(e) {
        props.onChange(e);
        props.handleClick(props.index);
    }

    function getContainerStyle() {
        let style = {
            ...styles.container,
            height: props.height
        }

        if (isClicked) {
            style = {
                ...style,
                ...styles.clicked
            }
        }

        return style
    }

    function getTextStyle() {
        let style = styles.text

        if (isClicked) {
            style = {
                ...style,
                ...styles.clicked
            }
        }

        return style
    }

    const returnDropdownItems = (items) => {
        let options = []
        for (let i = 0; i < items.length; i++) {
            options.push(<Option key={i}>{items[i]}</Option>)
        }
        return options
    };

    const InputBox = (props) => {
        switch (props.type) {
            case 'text': return (<Input className="input-text" onClick={() => props.handleClick(props.index)} onChange={handleOnChange} bordered={false} placeholder={props.placeholder} />);
            case 'dropdown': return (<Select
                className="input-text"
                onClick={() => props.handleClick(props.index)}
                mode="multiple"
                allowClear
                bordered={false}
                style={{ width: '100%' }}
                placeholder="Please select"
                onChange={handleOnChange}
            >
                {returnDropdownItems(props.options)}
            </Select>);
            case 'textarea': return (<Input.TextArea className="input-text" onClick={() => props.handleClick(props.index)} onChange={handleOnChange} bordered={false} placeholder={props.placeholder} />);
        }
    }


    return (
        <div style={getContainerStyle()}>
            <div style={getTextStyle()}>{props.title}</div>
            {InputBox(props)}
        </div>
    );
}

const styles = {
    container: {
        flex: 1,
        flexDirection: "column",
        width: "100%",
        backgroundColor: "#FFFDF5",
        borderBottomStyle: "solid",
        borderBottomWidth: 3,
        borderColor: "#828282",
        margin: 18,
        padding: 4,
        paddingTop: 6
    },
    text: {
        flex: 1,
        fontWeight: "bold",
        color: "#828282",
        marginLeft: 11
    },
    clicked: {
        color: "#F2C94C",
        borderColor: "#F2C94C"
    }
}

export default ModalInput;
