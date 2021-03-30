import React, { useEffect, useCallback, useState } from "react";
import { Modal, Form, Input, Button} from "antd";
import { useDropzone } from "react-dropzone";
import { adminUploadEmails } from "utils/api";
import MenteeButton from "./MenteeButton";
import ModalInput from "./ModalInput";

import "./css/UploadEmails.scss";
import { FileSyncOutlined } from "@ant-design/icons";

function UploadEmails(props) {
  function DragDrop(isMentor) {
    const [password, setPassword] = useState("");
    const [files, setFiles] = useState([]);

    const onDrop = (acceptedFiles) => {
      setFiles(acceptedFiles);
    }

    const onFinish = useCallback((files, password, mentor) => {
      async function uploadEmails(file) {
        await adminUploadEmails(file, password, mentor);
      }
      files.forEach((file) => {
        uploadEmails(file);
      });
      setFiles([]);
      setPassword("");
    }, []);

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: ".csv",
    });

    const includePassword = () => {
      if (!isMentor) {
        return (
          <Form.Item label="Password">
            <Input name="inputtedPassword" type="text" onChange={(e) => {setPassword(e.target.value);}}/>
          </Form.Item>
        );
      } else {
        return <div></div>
      }
    };
    //
    return (
      <div>
        <Form onFinish={() => onFinish(files, password, isMentor)} initialValues={{inputtedPassword: ""}}>
          <Form.Item>
            <div {...getRootProps()}>
              <p>Drag 'n' drop some files here, or click to select files</p>
              <em>(Only *.csv files will be accepted)</em>
              <input {...getInputProps()} />
            </div>
          </Form.Item>
          {includePassword()}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
      
    );
  }

  return (
    <Modal
      visible={props.modalVisible}
      setModalVisible={props.setModalVisible}
      footer={
        <MenteeButton
          content="Done"
          onClick={() => {
            props.setModalVisible(false);
          }}
        />
      }
    >
      {" "}
      <div className="dragdrops">
        <div className="dragdrop">
          <h3>Add Mentors</h3>
          {DragDrop(true)}
        </div>
        <div className="dragdrop">
          <h3>Add Mentees</h3>
          {DragDrop(false)}
        </div>
      </div>
    </Modal>
  );
}

export default UploadEmails;

//
