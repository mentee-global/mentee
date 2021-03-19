import React, { useEffect, useCallback, useState } from "react";
import { Modal } from "antd";
import { useDropzone } from 'react-dropzone';
import { adminUploadEmails } from "utils/api";

import "./css/UploadEmails.scss";

function UploadEmails(props) {

    function DragDrop(isMentor) {
        const onDrop = useCallback((acceptedFiles) => {
            async function uploadEmails(file, isMentor) {
                console.log(file);
                await adminUploadEmails(file, isMentor);
            }
            acceptedFiles.forEach((file) => { 
                uploadEmails(file, isMentor); 
            })
          
        }, [])

        const {getRootProps, getInputProps} = useDropzone({onDrop, accept: '.csv'});
      
        return (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <p>Drag 'n' drop some files here, or click to select files</p>
            <em>(Only *.csv files will be accepted)</em>
          </div>
        );
    };

    return (
        <Modal
            visible={props.modalVisible} 
            setModalVisible={props.setModalVisible}
            onCancel={() => {props.setModalVisible(false);}}
        >   <div className="dragdrops">
                <div className="dragdrop">
                    {DragDrop(true)}
                </div>
                <div className="dragdrop">
                    {DragDrop(false)}
                </div>
            </div>
        </Modal>
    );
}

export default UploadEmails;

//
