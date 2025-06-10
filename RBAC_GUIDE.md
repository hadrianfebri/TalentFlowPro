# Role-Based Access Control (RBAC) - TalentFlow.ai

## Overview
TalentFlow.ai mengimplementasikan sistem role-based access control dengan 3 level akses:
- **Admin**: Akses penuh ke semua fitur
- **HR**: Akses terbatas untuk mengelola SDM
- **Employee**: Akses terbatas hanya untuk data pribadi

## Role Permissions Matrix

### 📊 Dashboard & Analytics
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View company dashboard | ✅ | ✅ | ❌ |
| View personal dashboard | ✅ | ✅ | ✅ |
| AI insights & analytics | ✅ | ✅ | ❌ |
| Company statistics | ✅ | ✅ | ❌ |

### 👥 Employee Management
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all employees | ✅ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| Create employee | ✅ | ✅ | ❌ |
| Update employee data | ✅ | ✅ | ❌ |
| Delete employee | ✅ | ❌ | ❌ |

### ⏰ Attendance & Timesheet
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all attendance | ✅ | ✅ | ❌ |
| View own attendance | ✅ | ✅ | ✅ |
| Check-in/Check-out | ✅ | ✅ | ✅ |
| Modify attendance | ✅ | ✅ | ❌ |
| Attendance reports | ✅ | ✅ | ❌ |

### 💰 Payroll & Salary
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all payroll | ✅ | ✅ | ❌ |
| View own payslip | ✅ | ✅ | ✅ |
| Calculate payroll | ✅ | ✅ | ❌ |
| Generate payslips | ✅ | ✅ | ❌ |
| Payroll reports | ✅ | ✅ | ❌ |

### 📅 Leave Management
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all leave requests | ✅ | ✅ | ❌ |
| View own leave requests | ✅ | ✅ | ✅ |
| Submit leave request | ✅ | ✅ | ✅ |
| Approve/Reject leaves | ✅ | ✅ | ❌ |

### 📄 Document Management
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all documents | ✅ | ✅ | ❌ |
| View own documents | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ❌ |
| Create templates | ✅ | ✅ | ❌ |

### 💳 Reimbursement
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all reimbursements | ✅ | ✅ | ❌ |
| View own reimbursements | ✅ | ✅ | ✅ |
| Submit reimbursement | ✅ | ✅ | ✅ |
| Approve reimbursements | ✅ | ✅ | ❌ |

### 📈 Performance Management
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View all performance reviews | ✅ | ✅ | ❌ |
| View own performance | ✅ | ✅ | ✅ |
| Create performance reviews | ✅ | ✅ | ❌ |
| Submit self-assessment | ✅ | ✅ | ✅ |

### 🎯 Recruitment
| Feature | Admin | HR | Employee |
|---------|-------|----|---------| 
| View job postings | ✅ | ✅ | ❌ |
| Create job postings | ✅ | ✅ | ❌ |
| View applications | ✅ | ✅ | ❌ |
| Interview scheduling | ✅ | ✅ | ❌ |

## API Endpoints Access Control

### Employee Endpoints
```bash
# Admin/HR: Can access all employees
GET /api/employees
POST /api/employees
PUT /api/employees/:id
DELETE /api/employees/:id

# Employee: Only own data
GET /api/employees/:own_id
```

### Attendance Endpoints
```bash
# Admin/HR: All attendance data
GET /api/attendance
POST /api/attendance/checkin
PUT /api/attendance/:id

# Employee: Own attendance only
GET /api/attendance?employeeId=:own_id
POST /api/attendance/checkin (own data)
```

### Leave Endpoints
```bash
# Admin/HR: All leave requests + approval
GET /api/leaves
POST /api/leaves/:id/approve
POST /api/leaves/:id/reject

# Employee: Own leaves only
GET /api/leaves?employeeId=:own_id
POST /api/leaves (own request)
```

## Frontend Implementation

### Navigation Menu
```typescript
// Menu items filtered by role
const navigationItems = [
  {
    name: "Recruitment",
    allowedRoles: ["admin", "hr"], // Hidden for employees
  },
  {
    name: "Dashboard", 
    allowedRoles: ["admin", "hr", "employee"],
  }
];
```

### Component Permissions
```typescript
// Using usePermissions hook
const { isAdmin, isHR, isEmployee, canCreate } = usePermissions();

// Conditional rendering
{isAdminOrHR() && (
  <Button onClick={createEmployee}>
    Add Employee
  </Button>
)}

{canCreate("employees") && (
  <CreateEmployeeForm />
)}
```

## Security Implementation

### Backend Middleware
```typescript
// Role-based middleware
app.get('/api/employees', 
  isAuthenticated, 
  getUserProfile, 
  requireAdminOrHR, // Only Admin/HR
  getEmployees
);

app.get('/api/employees/:id',
  isAuthenticated,
  getUserProfile,
  requireEmployeeAccess, // Check if accessing own data
  getEmployee
);
```

### Database Schema
```sql
-- Users table with role column
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  role VARCHAR DEFAULT 'employee', -- admin, hr, employee
  employee_id INTEGER REFERENCES employees(id),
  company_id VARCHAR
);
```

## Employee Experience vs Admin/HR Experience

### Employee View
- **Dashboard**: Personal metrics only (own attendance, leaves, payslip)
- **Navigation**: Limited menu (no recruitment, no company-wide reports)
- **Data Access**: Only personal data (own attendance, leaves, documents)
- **Actions**: Self-service actions (check-in, leave requests, reimbursements)

### Admin/HR View  
- **Dashboard**: Company-wide analytics and insights
- **Navigation**: Full menu access including recruitment
- **Data Access**: All company data and employee information
- **Actions**: Management actions (approve leaves, create employees, reports)

## Default Role Assignment
- New users default to `employee` role
- Admin can promote users to `hr` or `admin` roles
- Role changes require admin privileges

## Error Handling
```json
// 403 Forbidden for insufficient permissions
{
  "message": "Access denied. Admin or HR role required."
}

// 403 for accessing other employee data
{
  "message": "Access denied. You can only access your own data."
}
```

Sistem RBAC ini memastikan setiap user hanya bisa mengakses data dan fitur sesuai dengan role mereka, memberikan keamanan berlapis untuk aplikasi HR.