import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TalentFlow.ai UMKM Essentials API',
      version: '1.0.0',
      description: 'API dokumentasi untuk platform HR cloud TalentFlow.ai yang dirancang khusus untuk UMKM Indonesia',
      contact: {
        name: 'TalentFlow.ai Support',
        email: 'support@talentflow.ai'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        ReplitAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie dari Replit Authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            profileImageUrl: { type: 'string' },
            companyId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            position: { type: 'string' },
            department: { type: 'string' },
            hireDate: { type: 'string', format: 'date' },
            salary: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'terminated'] },
            companyId: { type: 'string' }
          }
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            checkIn: { type: 'string', format: 'date-time' },
            checkOut: { type: 'string', format: 'date-time' },
            workingHours: { type: 'number' },
            status: { type: 'string', enum: ['present', 'absent', 'late', 'half_day'] }
          }
        },
        LeaveRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            leaveTypeId: { type: 'integer' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            totalDays: { type: 'number' },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            requirements: { type: 'string' },
            location: { type: 'string' },
            salary: { type: 'string' },
            employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'freelance'] },
            status: { type: 'string', enum: ['draft', 'active', 'closed'] },
            companyId: { type: 'string' },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        JobApplication: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            jobId: { type: 'integer' },
            applicantName: { type: 'string' },
            applicantEmail: { type: 'string' },
            applicantPhone: { type: 'string' },
            resumePath: { type: 'string' },
            coverLetter: { type: 'string' },
            stage: { type: 'string', enum: ['applied', 'review', 'interview', 'offer', 'hired', 'rejected'] },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Payroll: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            period: { type: 'string' },
            basicSalary: { type: 'string' },
            allowances: { type: 'string' },
            deductions: { type: 'string' },
            netSalary: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'processed', 'paid'] }
          }
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' },
            signed: { type: 'boolean' },
            signedBy: { type: 'string' },
            signedAt: { type: 'string', format: 'date-time' }
          }
        },
        Reimbursement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            description: { type: 'string' },
            amount: { type: 'string' },
            receiptPath: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            submittedDate: { type: 'string', format: 'date' }
          }
        },
        PerformanceReview: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employeeId: { type: 'integer' },
            reviewerId: { type: 'integer' },
            period: { type: 'string' },
            goals: { type: 'string' },
            achievements: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            feedback: { type: 'string' }
          }
        },
        SalaryComponent: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['allowance', 'deduction'] },
            isActive: { type: 'boolean' },
            companyId: { type: 'string' }
          }
        },
        BulkUploadResult: {
          type: 'object',
          properties: {
            success: { type: 'integer' },
            failed: { type: 'integer' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: { type: 'object' },
                  error: { type: 'string' }
                }
              }
            }
          }
        },
        AIMatchingResult: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            skillsMatch: { type: 'number' },
            experienceMatch: { type: 'number' },
            educationMatch: { type: 'number' },
            culturalFit: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } },
            strengths: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalEmployees: { type: 'integer' },
            presentToday: { type: 'integer' },
            pendingLeaves: { type: 'integer' },
            openJobs: { type: 'integer' },
            newApplications: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        ReplitAuth: []
      }
    ]
  },
  apis: ['./server/routes.ts'], // Path ke file yang berisi dokumentasi API
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TalentFlow.ai API Documentation'
  }));
  
  // JSON endpoint untuk spek OpenAPI
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}