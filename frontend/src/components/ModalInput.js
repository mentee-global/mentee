import React, { useState, useEffect } from "react";
import { Menu, Select, Input, Button } from "antd";

const { Option } = Select;

function ModalInput(props) {
    const [isClicked, setIsClicked] = useState(props.clicked)

    useEffect(() => {
        setIsClicked(props.clicked)
        console.log(props.index + ": ", props.clicked)
    }, [props.clicked]);

    function handleMenuClick(e) {
        console.log('clicked', e);
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
            case 'text': return (<Input onClick={() => props.handleClick(props.index)} bordered={false} placeholder={props.placeholder} />);
            case 'dropdown': return (<Select
                onClick={() => props.handleClick(props.index)}
                mode="multiple"
                allowClear
                bordered={false}
                style={{ width: '100%' }}
                placeholder="Please select"
            >
                {returnDropdownItems(props.options)}
            </Select>);
            case 'textarea': return (<Input.TextArea onClick={() => props.handleClick(props.index)} bordered={false} maxLength={500} placeholder={props.placeholder} />);
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
        margin: 5,
        padding: 4
    },
    text: {
        flex: 1,
        fontWeight: "bold"
    },
    placeholderContainer: {
        flex: 0.8,
        width: "100%",
    },
    placeholderText: {
        flex: 1,
        width: "70%",
        alignItems: "center",
        color: "#828282"
    },
    clicked: {
        color: "#F2C94C",
        borderColor: "#F2C94C"
    }
}

export default ModalInput;
