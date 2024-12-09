import { withRouter } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { getOriginSignDoc, saveSignedDoc } from "utils/api";
import { css } from "@emotion/css";
import { Typography, Button } from "antd";
import { useTranslation } from "react-i18next";
import { PDFDocument } from "pdf-lib";
import SignatureCanvas from "react-signature-canvas";
import { useSelector } from "react-redux";

const DigitalSign = ({ location }) => {
  const { t } = useTranslation();
  const train_id = new URLSearchParams(location.search).get("train_id");
  const role = new URLSearchParams(location.search).get("role");
  const [signDoc, setSignDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [signedPdfBlob, setSignedPdfBlob] = useState(null);
  const [signedpdfUrl, setSignedpdfUrl] = useState(null);
  const signaturePadRef = useRef(null);
  const { user } = useSelector((state) => state.user);
  let user_email = new URLSearchParams(location.search).get("email");
  if (user) {
    user_email = user.email;
  }

  useEffect(() => {
    getOriginSignDoc()
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
    const firstPage = pages[0];

    // Customize position and size of the signature
    const { width, height } = firstPage.getSize();
    firstPage.drawImage(signatureImage, {
      x: width / 2 - 120, // Centered horizontally
      y: 70, // Adjust Y position
      width: 100,
      height: 40,
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
    <div
      className={css`
        min-width: 400px;
        width: 90%;
        background: #fff;
        border-radius: 2em;
        padding: 2em;
        margin: 1em 0;
        @media (max-width: 991px) {
          width: 90%;
          margin: 2em 0;
        }

        @media (max-width: 575px) {
          width: 100%;
          margin: 0;
          border-radius: 0;
        }
      `}
    >
      <Typography.Title level={2}>Sign page</Typography.Title>
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
        <Button onClick={() => signaturePadRef.current.clear()}>Clear</Button>
        <Button
          type="primary"
          style={{ marginLeft: "20px", marginRight: "20px" }}
          // disabled={signaturePadRef.current.isEmpty()}
          onClick={saveSignature}
        >
          Add Signature
        </Button>
        {signedPdfBlob && (
          <Button onClick={downloadSignedPdf}>Download Signed PDF</Button>
        )}
      </div>
    </div>
  );
};

export default withRouter(DigitalSign);
