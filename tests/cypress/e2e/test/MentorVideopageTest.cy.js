import { MentorDashboard } from "../pages/MentorDashboard";
const mentor = new MentorDashboard();
const mentorEmail = Cypress.env("MENTOR_EMAIL");
const mentorPassword = Cypress.env("MENTOR_PASSWORD");

describe("chceking the video page of mentor", () => {
  it("checking page elements visibility", () => {
    cy.visit("/login");

    cy.get(
      " #root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div.ant-space.css-1axsfu3.ant-space-vertical.ant-space-gap-row-middle.ant-space-gap-col-middle.css-3w4dbw > div:nth-child(1) > div"
    ).click();

    cy.get("#email").type(mentorEmail);
    cy.get("#password").type(mentorPassword);

    cy.get(".ant-btn > span").click();
    cy.wait(1000);

    mentor.selectEnglish();
    cy.get(
      'span[role="img"][aria-label="video-camera"].anticon-video-camera'
    ).click();

    cy.get("#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > h2").should("have.text", "Your Videos");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(1)"
    ).should("have.text", "Title");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(2)"
    ).should("have.text", "Specializations Tag");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div > div > div > div > div > div > table > thead > tr > th:nth-child(3)"
    ).should("be.visible");

    cy.get('button.ant-btn-primary span:contains("Add Video")').should(
      "be.visible"
    );

    cy.get('button.ant-btn-primary span:contains("Add Video")').should(
      "have.text",
      "Add Video"
    );

    cy.get('button.ant-btn-primary span:contains("Add Video")').click();

    cy.get("#video-submit_title").type("my skills intro");

    cy.get("#video-submit_url").type(
      "https://www.youtube.com/watch?v=Gjnup-PuquQ"
    );

    cy.get("#video-submit_tag").click();

    cy.contains(".ant-select-item-option-content", "Computer Science").click();

    cy.get('button.ant-btn-primary span:contains("Submit")').click();

    cy.get(".ant-table-tbody").should("contain.text", "my skills intro");

    cy.get(
      "#root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div > div > div > div > div > div > table > tbody > tr:nth-child(2) > td:nth-child(3) > div > div:nth-child(2) > button"
    ).click();

    cy.contains("span", "Yes").click();
  });
});
