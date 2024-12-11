import React, { useEffect, useState, useRef } from "react";
import { saveSignedDoc, getTrainVideo } from "utils/api";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";
import { PDFDocument } from "pdf-lib";
import SignatureCanvas from "react-signature-canvas";

const DigitalSignModal = (props) => {
  const { t } = useTranslation();
  const train_id = props.train_id;
  const role = props.role;
  const [signDoc, setSignDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [signedPdfBlob, setSignedPdfBlob] = useState(null);
  const [signedpdfUrl, setSignedpdfUrl] = useState(null);
  const signaturePadRef = useRef(null);
  let user_email = props.email;
  
  useEffect(() => {
    getTrainVideo(train_id)
      .then((res) => {
        if (res.data) {
          setPdfUrl(
            window.URL.createObjectURL(
              new Blob([res.data], { type: "application/pdf" })
            )
          );
          setSignDoc(res.data);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const saveSignature = async () => {
    if (!signDoc) return;
    if (signaturePadRef.current.isEmpty()) return;

    const now = new Date();
    const dateTime = now.toLocaleString();
    // Get the signature as an image
    const signatureDataURL = signaturePadRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    // Load the existing PDF
    const pdfBytes = await signDoc.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Embed the signature image
    const signatureImageBytes = await fetch(signatureDataURL).then((res) =>
      res.arrayBuffer()
    );
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    // Get the first page and add the signature
    const pages = pdfDoc.getPages();
    const lastpage = pages[pages.length - 1];

    // Customize position and size of the signature
    const { width, height } = lastpage.getSize();
    lastpage.drawImage(signatureImage, {
      x: width / 2 - 120, // Centered horizontally
      y: 70, // Adjust Y position
      width: 100,
      height: 40,
    });

    // Add the current date and time to the PDF
    lastpage.drawText(`${dateTime}`, {
      x: width / 2 + 90, // Adjust the X position
      y: 75, // Adjust the Y position
      size: 12,
    });

    // Save the updated PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedBlob = new Blob([signedPdfBytes], { type: "application/pdf" });
    setSignedPdfBlob(signedBlob);
    setSignedpdfUrl(
      window.URL.createObjectURL(
        new Blob([signedPdfBytes], { type: "application/pdf" })
      )
    );
    saveSignedDoc(signedBlob, user_email, train_id, role);
  };

  const goBackAndRefresh = () => {
    props.finish();
  };

  const downloadSignedPdf = () => {
    if (signedPdfBlob) {
      const url = URL.createObjectURL(signedPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "signed-document.pdf";
      link.click();
    }
  };

  return (
    <Modal
      style={{minWidth:"800px"}}
      title="Sign"
      open={props.open}
      onCancel={() => props.finish()}
      footer={[
        <Button onClick={() => signaturePadRef.current.clear()}>Clear</Button>,
        <Button
          type="primary"
          style={{ marginLeft: "20px", marginRight: "20px" }}
          onClick={saveSignature}
        >
          Add Signature
        </Button>,
        <Button disabled={!signedPdfBlob} onClick={downloadSignedPdf}>Download Signed PDF</Button>,
        <Button
          disabled={!signedPdfBlob}
          style={{ marginLeft: "20px" }}
          type="primary"
          onClick={goBackAndRefresh}
        >
          Confirm
        </Button>
      ]}
    >
      {signDoc && (
        <iframe
          src={signedpdfUrl ? signedpdfUrl : pdfUrl}
          title="PDF Viewer"
          width="100%"
          height="600px"
        ></iframe>
      )}
      {/* Signature Pad */}
      <div style={{ textAlign: "center" }}>
        <h2>Draw Your Signature</h2>
        <div
          style={{
            border: "1px solid black",
            cursor: "crosshair",
            marginBottom: "20px",
            width: "fit-content",
            height: "fit-contnet",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <SignatureCanvas
            ref={signaturePadRef}
            penColor="black"
            canvasProps={{
              width: 600,
              height: 100,
              className: "sigCanvas",
            }}
          />
        </div>
        </div>
    </Modal>
  );
};

export default DigitalSignModal;
