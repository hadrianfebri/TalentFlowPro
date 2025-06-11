import axios, { AxiosResponse } from 'axios';

export interface JobData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  type: string;
  openings: number;
  companyName?: string;
  companyDescription?: string;
  contactEmail?: string;
  benefits?: string[];
}

export interface PostResult {
  externalId: string;
  url: string;
  platform: string;
  postedAt: string;
  status: 'success' | 'error';
  error?: string;
}

// JobStreet Indonesia Integration
export class JobStreetIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://api.jobstreet.co.id/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async postJob(jobData: JobData): Promise<PostResult> {
    try {
      const payload = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        salary_range: jobData.salaryRange,
        employment_type: this.mapJobType(jobData.type),
        openings: jobData.openings,
        company_name: jobData.companyName,
        company_description: jobData.companyDescription,
        contact_email: jobData.contactEmail,
        benefits: jobData.benefits
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/jobs`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        externalId: response.data.job_id,
        url: `https://www.jobstreet.co.id/job/${response.data.job_id}`,
        platform: 'JobStreet',
        postedAt: new Date().toISOString(),
        status: 'success'
      };
    } catch (error: any) {
      return {
        externalId: '',
        url: '',
        platform: 'JobStreet',
        postedAt: new Date().toISOString(),
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  private mapJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'contract': 'CONTRACT',
      'internship': 'INTERNSHIP'
    };
    return typeMap[type] || 'FULL_TIME';
  }
}

// Indeed Integration
export class IndeedIntegration {
  private publisherId: string;
  private apiKey: string;
  private baseUrl: string = 'https://secure.indeed.com/rpc/job';

  constructor(publisherId: string, apiKey: string) {
    this.publisherId = publisherId;
    this.apiKey = apiKey;
  }

  async postJob(jobData: JobData): Promise<PostResult> {
    try {
      const payload: Record<string, string> = {
        publisher: this.publisherId,
        format: 'json',
        v: '2',
        method: 'job.create',
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        company: jobData.companyName || '',
        jobtype: this.mapJobType(jobData.type),
        salary: jobData.salaryRange,
        email: jobData.contactEmail || '',
        requirements: jobData.requirements
      };

      const response: AxiosResponse = await axios.post(
        this.baseUrl,
        new URLSearchParams(payload),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        externalId: response.data.job_id,
        url: `https://www.indeed.com/viewjob?jk=${response.data.job_id}`,
        platform: 'Indeed',
        postedAt: new Date().toISOString(),
        status: 'success'
      };
    } catch (error: any) {
      return {
        externalId: '',
        url: '',
        platform: 'Indeed',
        postedAt: new Date().toISOString(),
        status: 'error',
        error: error.response?.data?.error || error.message
      };
    }
  }

  private mapJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full-time': 'fulltime',
      'part-time': 'parttime',
      'contract': 'contract',
      'internship': 'internship'
    };
    return typeMap[type] || 'fulltime';
  }
}

// LinkedIn Jobs Integration
export class LinkedInIntegration {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private baseUrl: string = 'https://api.linkedin.com/v2';

  constructor(clientId: string, clientSecret: string, accessToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
  }

  async postJob(jobData: JobData): Promise<PostResult> {
    try {
      const payload = {
        title: jobData.title,
        description: jobData.description,
        location: {
          countryCode: 'ID',
          city: jobData.location
        },
        employmentType: this.mapJobType(jobData.type),
        seniority: 'ENTRY_LEVEL',
        companyName: jobData.companyName,
        applyMethod: {
          companyApplyUrl: process.env.COMPANY_APPLY_URL || 'https://company.com/apply'
        }
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/jobPostings`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202210'
          }
        }
      );

      return {
        externalId: response.data.id,
        url: `https://www.linkedin.com/jobs/view/${response.data.id}`,
        platform: 'LinkedIn',
        postedAt: new Date().toISOString(),
        status: 'success'
      };
    } catch (error: any) {
      return {
        externalId: '',
        url: '',
        platform: 'LinkedIn',
        postedAt: new Date().toISOString(),
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  private mapJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'contract': 'CONTRACT',
      'internship': 'INTERNSHIP'
    };
    return typeMap[type] || 'FULL_TIME';
  }
}

// Glints Integration
export class GlintsIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://api.glints.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async postJob(jobData: JobData): Promise<PostResult> {
    try {
      const payload = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        salary_range: jobData.salaryRange,
        job_type: this.mapJobType(jobData.type),
        openings: jobData.openings,
        company_name: jobData.companyName,
        contact_email: jobData.contactEmail
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/jobs`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        externalId: response.data.job_id,
        url: `https://glints.com/opportunities/jobs/${response.data.job_id}`,
        platform: 'Glints',
        postedAt: new Date().toISOString(),
        status: 'success'
      };
    } catch (error: any) {
      return {
        externalId: '',
        url: '',
        platform: 'Glints',
        postedAt: new Date().toISOString(),
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  private mapJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'contract': 'CONTRACT',
      'internship': 'INTERNSHIP'
    };
    return typeMap[type] || 'FULL_TIME';
  }
}

// Kalibrr Integration
export class KalibrrIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://api.kalibrr.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async postJob(jobData: JobData): Promise<PostResult> {
    try {
      const payload = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        location: jobData.location,
        salary_min: this.extractMinSalary(jobData.salaryRange),
        salary_max: this.extractMaxSalary(jobData.salaryRange),
        employment_type: this.mapJobType(jobData.type),
        openings: jobData.openings,
        company_name: jobData.companyName
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/jobs`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        externalId: response.data.id,
        url: `https://www.kalibrr.com/job/${response.data.id}`,
        platform: 'Kalibrr',
        postedAt: new Date().toISOString(),
        status: 'success'
      };
    } catch (error: any) {
      return {
        externalId: '',
        url: '',
        platform: 'Kalibrr',
        postedAt: new Date().toISOString(),
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  private mapJobType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'full-time': 'full_time',
      'part-time': 'part_time',
      'contract': 'contract',
      'internship': 'internship'
    };
    return typeMap[type] || 'full_time';
  }

  private extractMinSalary(salaryRange: string): number {
    const match = salaryRange.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) * 1000000 : 0; // Convert millions to actual number
  }

  private extractMaxSalary(salaryRange: string): number {
    const matches = salaryRange.match(/(\d+(?:\.\d+)?)/g);
    if (matches && matches.length > 1) {
      return parseFloat(matches[1]) * 1000000; // Convert millions to actual number
    }
    return this.extractMinSalary(salaryRange) * 1.5; // If only one number, assume 50% higher for max
  }
}

// Main Integration Manager
export class JobPlatformManager {
  private integrations: Map<string, any> = new Map();

  constructor() {
    // Initialize integrations with API keys from environment variables
    if (process.env.JOBSTREET_API_KEY) {
      this.integrations.set('jobstreet', new JobStreetIntegration(process.env.JOBSTREET_API_KEY));
    }

    if (process.env.INDEED_PUBLISHER_ID && process.env.INDEED_API_KEY) {
      this.integrations.set('indeed', new IndeedIntegration(
        process.env.INDEED_PUBLISHER_ID,
        process.env.INDEED_API_KEY
      ));
    }

    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET && process.env.LINKEDIN_ACCESS_TOKEN) {
      this.integrations.set('linkedin', new LinkedInIntegration(
        process.env.LINKEDIN_CLIENT_ID,
        process.env.LINKEDIN_CLIENT_SECRET,
        process.env.LINKEDIN_ACCESS_TOKEN
      ));
    }

    if (process.env.GLINTS_API_KEY) {
      this.integrations.set('glints', new GlintsIntegration(process.env.GLINTS_API_KEY));
    }

    if (process.env.KALIBRR_API_KEY) {
      this.integrations.set('kalibrr', new KalibrrIntegration(process.env.KALIBRR_API_KEY));
    }
  }

  async postToMultiplePlatforms(platforms: string[], jobData: JobData): Promise<PostResult[]> {
    const results: PostResult[] = [];

    for (const platform of platforms) {
      try {
        const integration = this.integrations.get(platform);
        if (!integration) {
          results.push({
            externalId: '',
            url: '',
            platform,
            postedAt: new Date().toISOString(),
            status: 'error',
            error: `Integration not configured for ${platform}. Please add API credentials.`
          });
          continue;
        }

        const result = await integration.postJob(jobData);
        results.push(result);
      } catch (error: any) {
        results.push({
          externalId: '',
          url: '',
          platform,
          postedAt: new Date().toISOString(),
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.integrations.keys());
  }

  isConfigured(platform: string): boolean {
    return this.integrations.has(platform);
  }
}