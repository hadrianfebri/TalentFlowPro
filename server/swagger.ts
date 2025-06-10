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