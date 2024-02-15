export class AdminAccountData {
  clickAccountData() {
    cy.get(".ant-menu-title-content").eq(5).click();
  }
  searchByName() {
    const searchTerm = "roberto";
    cy.get("#search").type(`${searchTerm}{enter}`).wait(5000);
    cy.get(".ant-table-tbody")
      .should("have.length.greaterThan", 0)
      .and("contain.text",searchTerm);
  }
  filterByRole() {
    const roles = [0, 1, 2, 3];

    roles.map((role) => {
      cy.get(
        ".table-button-group > :nth-child(1)"
      ).click();
      cy.get(".ant-dropdown-menu-title-content").eq(role).click();
      const roleSpecificHeadings = this.getRoleSpecificHeading(role);
      roleSpecificHeadings.forEach((heading) => {
        cy.get(".ant-table-thead").should("contain.text", heading);
      });
    });
  }
  getRoleSpecificHeading(role) {
    switch (role) {
      case 0:
        return [
          "Name",
          "No. of Appointments",
          "Appointments Available?",
          "Videos Posted?",
          "Picture Uploaded?",
          "Delete",
          "Link to Profile",
          "Profile Picture",
        ];
      case 1:
        return [
          "Name",
          "No. of Appointments",
          "Delete",
          "Link to Profile",
          "Profile Picture",
        ];
      case 2:
        return [
          "Email",
          "Mentors",
          "Mentees",
          "Restricted",
          "Organization Name",
          `Contact Person's Full Name`,
          "Website",
          "Delete",
          "Link to Profile",
          "Profile Picture",
        ];
      case 3:
        return ["Name", "Email", "Delete"];
      default:
        return "Default";
    }
  }
}
