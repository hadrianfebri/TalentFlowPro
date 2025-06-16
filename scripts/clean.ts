import { db } from "../server/db.js";
import { 
  companies, 
  departments, 
  employees, 
  users,
  jobs,
  salaryComponents,
  employeeSalaryComponents,
  jobApplications,
  attendance,
  leaveRequests,
  payroll,
  documents,
  reimbursements,
  performanceReviews
} from "../shared/schema.js";

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...");

  try {
    // Delete in reverse order of dependencies
    console.log("🗑️ Cleaning job applications...");
    await db.delete(jobApplications);
    
    console.log("🗑️ Cleaning jobs...");
    await db.delete(jobs);
    
    console.log("🗑️ Cleaning performance reviews...");
    await db.delete(performanceReviews);
    
    console.log("🗑️ Cleaning reimbursements...");
    await db.delete(reimbursements);
    
    console.log("🗑️ Cleaning documents...");
    await db.delete(documents);
    
    console.log("🗑️ Cleaning payroll...");
    await db.delete(payroll);
    
    console.log("🗑️ Cleaning leave requests...");
    await db.delete(leaveRequests);
    
    console.log("🗑️ Cleaning attendance...");
    await db.delete(attendance);
    
    console.log("🗑️ Cleaning employee salary components...");
    await db.delete(employeeSalaryComponents);
    
    console.log("🗑️ Cleaning salary components...");
    await db.delete(salaryComponents);
    
    console.log("🗑️ Cleaning employees...");
    await db.delete(employees);
    
    console.log("🗑️ Cleaning users...");
    await db.delete(users);
    
    console.log("🗑️ Cleaning departments...");
    await db.delete(departments);
    
    console.log("🗑️ Cleaning companies...");
    await db.delete(companies);

    console.log("✅ Database cleanup completed successfully!");

  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    throw error;
  }
}

// Run the clean function
cleanDatabase()
  .then(() => {
    console.log("🎉 Cleanup process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Cleanup process failed:", error);
    process.exit(1);
  });