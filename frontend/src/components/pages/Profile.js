import React, { useState } from "react";
import { Button, Modal } from "antd";
import MentorProfileModal from "../MentorProfileModal";

function Profile() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <div>
      <Button type="primary" onClick={() => setModalVisible(true)}>
        Open Modal
        </Button>
      <Modal
        visible={modalVisible}
        bodyStyle={{ padding: 0 }}
        footer={<Button
          type="default"
          shape="round"
          style={{
            borderRadius: 13,
            marginRight: 15,
            backgroundColor: "#E4BB4F"
          }}
          onClick={() => setModalVisible(false)}
        >
          Save</Button>}
      >
        <div style={{ height: 1000, width: "100%", backgroundColor: "yellow" }}>

        </div>
      </Modal>
    </div>

  );
}

export default Profile;
