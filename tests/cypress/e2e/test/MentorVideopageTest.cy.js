// import { MentorDashboard } from "../pages/MentorDashboard";
// import { LoginPage } from "../pages/LoginPage";

// const mentor = new MentorDashboard();
// const mentorEmail = Cypress.env("MENTOR_EMAIL");
// const mentorPassword = Cypress.env("MENTOR_PASSWORD");
// const login = new LoginPage();
//===================the test case is being commented due to existing bugs====================
// describe("chceking the video page of mentor", () => {
//   it("checking page elements visibility", () => {
//     cy.visit("/login");
//     login.loginMentor();
//     cy.wait(10000);
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
//     cy.wait(10000);
//     cy.get(".ant-table-tbody").should("contain.text", "my skills intro");

//     cy.get(
//       ".ant-btn-dangerous"
//     ).eq(0).click();

//     cy.contains("span", "Yes").click();
//   });
// });