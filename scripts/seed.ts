import { db } from "../server/db.js";
import { 
  companies, 
  departments, 
  employees, 
  users,
  jobs,
  salaryComponents
} from "../shared/schema.js";
import bcryptjs from "bcryptjs";

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
      { name: "Human Resources", companyId: company.id, description: "Manages employee relations and policies" },
      { name: "Engineering", companyId: company.id, description: "Software development and technical operations" },
      { name: "Marketing", companyId: company.id, description: "Marketing and business development" },
      { name: "Finance", companyId: company.id, description: "Financial planning and accounting" }
    ];

    const insertedDepartments = await db.insert(departments).values(departments_data).returning();

    // Seed salary components
    console.log("💰 Seeding salary components...");
    const salary_components_data = [
      { companyId: company.id, name: "Gaji Pokok", code: "BASIC", type: "allowance", category: "fixed", description: "Basic salary" },
      { companyId: company.id, name: "Tunjangan Transport", code: "TRANSPORT", type: "allowance", category: "fixed", description: "Transportation allowance" },
      { companyId: company.id, name: "Tunjangan Makan", code: "MEAL", type: "allowance", category: "fixed", description: "Meal allowance" },
      { companyId: company.id, name: "BPJS Kesehatan", code: "BPJS_HEALTH", type: "deduction", category: "benefit", description: "Health insurance deduction" },
      { companyId: company.id, name: "BPJS Ketenagakerjaan", code: "BPJS_EMP", type: "deduction", category: "benefit", description: "Employment insurance deduction" },
      { companyId: company.id, name: "PPh 21", code: "PPH21", type: "deduction", category: "variable", description: "Income tax deduction" }
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
        profileImageUrl: null
      },
      {
        id: "user-hr-1", 
        email: "hr@contohUMKM.com",
        firstName: "HR",
        lastName: "Manager",
        profileImageUrl: null
      },
      {
        id: "user-emp-1",
        email: "john@contohUMKM.com", 
        firstName: "John",
        lastName: "Doe",
        profileImageUrl: null
      },
      {
        id: "user-emp-2",
        email: "jane@contohUMKM.com",
        firstName: "Jane", 
        lastName: "Smith",
        profileImageUrl: null
      }
    ];

    const insertedUsers = await db.insert(users).values(users_data).returning();

    // Seed employees
    console.log("👥 Seeding employees...");
    const hashedPassword = await bcryptjs.hash("password123", 10);
    
    const employees_data = [
      {
        companyId: company.id,
        departmentId: insertedDepartments[0].id, // HR
        userId: insertedUsers[0].id,
        employeeId: "EMP001",
        firstName: "Admin",
        lastName: "System", 
        email: "admin@contohUMKM.com",
        phone: "+62-812-3456-7890",
        position: "System Administrator",
        role: "admin",
        salary: "15000000",
        joinDate: new Date("2024-01-01"),
        status: "active",
        password: hashedPassword
      },
      {
        companyId: company.id,
        departmentId: insertedDepartments[0].id, // HR
        userId: insertedUsers[1].id,
        employeeId: "EMP002", 
        firstName: "HR",
        lastName: "Manager",
        email: "hr@contohUMKM.com",
        phone: "+62-812-3456-7891",
        position: "HR Manager",
        role: "hr",
        salary: "12000000",
        joinDate: new Date("2024-01-15"),
        status: "active",
        password: hashedPassword
      },
      {
        companyId: company.id,
        departmentId: insertedDepartments[1].id, // Engineering
        userId: insertedUsers[2].id,
        employeeId: "EMP003",
        firstName: "John",
        lastName: "Doe",
        email: "john@contohUMKM.com",
        phone: "+62-812-3456-7892",
        position: "Frontend Developer",
        role: "employee", 
        salary: "8000000",
        joinDate: new Date("2024-02-01"),
        status: "active",
        password: hashedPassword
      },
      {
        companyId: company.id,
        departmentId: insertedDepartments[2].id, // Marketing
        userId: insertedUsers[3].id,
        employeeId: "EMP004",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@contohUMKM.com",
        phone: "+62-812-3456-7893", 
        position: "Marketing Specialist",
        role: "employee",
        salary: "7000000",
        joinDate: new Date("2024-02-15"),
        status: "active",
        password: hashedPassword
      }
    ];

    const insertedEmployees = await db.insert(employees).values(employees_data).returning();

    // Seed sample jobs
    console.log("💼 Seeding job postings...");
    const jobs_data = [
      {
        companyId: company.id,
        departmentId: insertedDepartments[1].id, // Engineering
        title: "Senior Backend Developer",
        description: "We are looking for an experienced backend developer to join our team.",
        requirements: "- 3+ years experience with Node.js\n- Experience with PostgreSQL\n- Knowledge of REST APIs",
        location: "Jakarta, Indonesia",
        salaryRange: "10000000-15000000",
        employmentType: "full-time",
        status: "active",
        openings: 2
      },
      {
        companyId: company.id,
        departmentId: insertedDepartments[2].id, // Marketing
        title: "Digital Marketing Manager", 
        description: "Lead our digital marketing initiatives and grow our online presence.",
        requirements: "- 2+ years experience in digital marketing\n- Google Ads certification\n- Social media expertise",
        location: "Jakarta, Indonesia",
        salaryRange: "8000000-12000000",
        employmentType: "full-time", 
        status: "active",
        openings: 1
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
    
    console.log("\n👤 Default login credentials:");
    console.log("Admin: admin@contohUMKM.com / password123");
    console.log("HR: hr@contohUMKM.com / password123");
    console.log("Employee: john@contohUMKM.com / password123");
    console.log("Employee: jane@contohUMKM.com / password123");

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