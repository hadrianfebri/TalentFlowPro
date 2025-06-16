import { db } from "../server/db.js";
import { 
  companies, 
  departments, 
  employees, 
  users,
  jobs,
  salaryComponents
} from "../shared/schema.js";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed companies
    console.log("👥 Seeding companies...");
    const [company] = await db.insert(companies).values({
      id: "company-1",
      name: "PT. Contoh UMKM",
      address: "Jl. Sudirman No. 123, Jakarta",
      phone: "+62-21-12345678",
      email: "info@contohUMKM.com"
    }).returning();

    // Seed departments
    console.log("🏢 Seeding departments...");
    const departments_data = [
      { name: "Human Resources", companyId: company.id },
      { name: "Engineering", companyId: company.id },
      { name: "Marketing", companyId: company.id },
      { name: "Finance", companyId: company.id }
    ];

    const insertedDepartments = await db.insert(departments).values(departments_data).returning();

    // Seed salary components
    console.log("💰 Seeding salary components...");
    const salary_components_data = [
      { 
        companyId: company.id, 
        name: "Gaji Pokok", 
        code: "BASIC", 
        type: "allowance", 
        category: "fixed", 
        description: "Basic salary",
        defaultAmount: "5000000" 
      },
      { 
        companyId: company.id, 
        name: "Tunjangan Transport", 
        code: "TRANSPORT", 
        type: "allowance", 
        category: "fixed", 
        description: "Transportation allowance",
        defaultAmount: "500000" 
      }
    ];

    const insertedSalaryComponents = await db.insert(salaryComponents).values(salary_components_data).returning();

    // Seed users (for authentication)
    console.log("👤 Seeding users...");
    const users_data = [
      {
        id: "user-admin-1",
        email: "admin@contohUMKM.com",
        firstName: "Admin",
        lastName: "System",
        role: "admin",
        companyId: company.id
      },
      {
        id: "user-hr-1", 
        email: "hr@contohUMKM.com",
        firstName: "HR",
        lastName: "Manager",
        role: "hr",
        companyId: company.id
      }
    ];

    const insertedUsers = await db.insert(users).values(users_data).returning();

    // Seed employees
    console.log("👥 Seeding employees...");
    const employees_data = [
      {
        companyId: company.id,
        departmentId: insertedDepartments[0].id,
        userId: insertedUsers[0].id,
        employeeId: "EMP001",
        firstName: "Admin",
        lastName: "System", 
        workEmail: "admin@contohUMKM.com",
        phone: "+62-812-3456-7890",
        position: "System Administrator",
        hireDate: "2024-01-01",
        status: "active",
        basicSalary: "15000000"
      },
      {
        companyId: company.id,
        departmentId: insertedDepartments[0].id,
        userId: insertedUsers[1].id,
        employeeId: "EMP002", 
        firstName: "HR",
        lastName: "Manager",
        workEmail: "hr@contohUMKM.com",
        phone: "+62-812-3456-7891",
        position: "HR Manager",
        hireDate: "2024-01-15",
        status: "active",
        basicSalary: "12000000"
      }
    ];

    const insertedEmployees = await db.insert(employees).values(employees_data).returning();

    // Seed sample jobs
    console.log("💼 Seeding job postings...");
    const jobs_data = [
      {
        companyId: company.id,
        departmentId: insertedDepartments[1].id,
        title: "Backend Developer",
        description: "We are looking for an experienced backend developer.",
        requirements: "3+ years experience with Node.js and PostgreSQL",
        location: "Jakarta, Indonesia",
        salaryRange: "8000000-12000000",
        type: "full-time",
        status: "active",
        openings: 1,
        createdBy: insertedUsers[0].id
      }
    ];

    await db.insert(jobs).values(jobs_data);

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📋 Seeded data summary:");
    console.log(`- 1 company: ${company.name}`);
    console.log(`- ${insertedDepartments.length} departments`);
    console.log(`- ${insertedSalaryComponents.length} salary components`);
    console.log(`- ${insertedUsers.length} users`);
    console.log(`- ${insertedEmployees.length} employees`);
    console.log(`- ${jobs_data.length} job postings`);
    
    console.log("\n👤 Default login credentials for testing:");
    console.log("Admin: admin@contohUMKM.com");
    console.log("HR: hr@contohUMKM.com");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log("🎉 Seeding process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });