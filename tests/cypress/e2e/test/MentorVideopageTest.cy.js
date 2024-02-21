// import { MentorDashboard } from "../pages/MentorDashboard";
// import { LoginPage } from "../pages/LoginPage";

// const mentor = new MentorDashboard();
// const mentorEmail = Cypress.env("MENTOR_EMAIL");
// const mentorPassword = Cypress.env("MENTOR_PASSWORD");
// const login = new LoginPage();

// describe("chceking the video page of mentor", () => {
//   it("checking page elements visibility", () => {
//     cy.visit("/login");
//     login.loginMentor();
//     // cy.get(
//     //   " #root > div.ant-layout.ant-layout-has-sider.css-1axsfu3 > main > div > div.ant-col.ant-col-11.css-qqdj8t.css-1axsfu3 > div.css-1c9mpvn > div.ant-space.css-1axsfu3.ant-space-vertical.ant-space-gap-row-middle.ant-space-gap-col-middle.css-3w4dbw > div:nth-child(1) > div"
//     // ).click();

//     // cy.get("#email").type(mentorEmail);
//     // cy.get("#password").type(mentorPassword);

//     // cy.get(".ant-btn > span").click();
//     // cy.wait(1000);

//     mentor.selectEnglish();
//     cy.get(
//       "li.ant-menu-item"
//     ).eq(5).click();

//     cy.get(
//       "li.ant-menu-item"
//     ).eq(5).should("contain.text", "Your Videos");

//     cy.get(
//       ".ant-table-thead",{timeout:5000}
//     ).should("contain.text", "Title");

//     cy.get(
//       ".ant-table-thead"
//     ).should("contain.text", "Specializations Tag");

//     cy.get(
//       ".ant-table-thead"
//     ).should("be.visible");

//     cy.get('button.ant-btn-primary span:contains("Add Video")').should(
//       "be.visible"
//     );

//     cy.get('button.ant-btn-primary span:contains("Add Video")').should(
//       "have.text",
//       "Add Video"
//     );

//     cy.get('button.ant-btn-primary span:contains("Add Video")').click();

//     cy.get("#video-submit_title").type("my skills intro");

//     cy.get("#video-submit_url").type(
//       "https://www.youtube.com/watch?v=Gjnup-PuquQ"
//     );

//     cy.get("#video-submit_tag").click();

//     cy.contains(".ant-select-item-option-content", "Computer Science").click();

//     cy.get('button.ant-btn-primary span:contains("Submit")').click();
//     cy.wait(5000);
//     cy.get(".ant-table-tbody").should("contain.text", "my skills intro");

//     cy.get(
//       ".ant-btn-dangerous"
//     ).eq(1).click();

//     cy.contains("span", "Yes").click();
//   });
// });
