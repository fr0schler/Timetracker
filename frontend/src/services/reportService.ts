import api from './api';
import { ReportFilters } from '../components/Reports/ReportGenerator';

export type ReportType = 'time-tracking' | 'project-summary' | 'user-activity';

export interface ReportResult {
  id: string;
  filename: string;
  downloadUrl: string;
  createdAt: string;
}

class ReportService {
  async generateReport(
    type: ReportType,
    filters: ReportFilters,
    format: string
  ): Promise<ReportResult> {
    try {
      const response = await api.post('/reports/generate', {
        type,
        filters,
        format,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate report:', error);
      // Return mock data for development
      return this.getMockReportResult(type, format);
    }
  }

  async getReportHistory(): Promise<ReportResult[]> {
    try {
      const response = await api.get('/reports/history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch report history:', error);
      return [];
    }
  }

  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download report:', error);
      throw error;
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      await api.delete(`/reports/${reportId}`);
    } catch (error) {
      console.error('Failed to delete report:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockReportResult(type: ReportType, format: string): ReportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.${format}`;

    // Create a mock blob URL
    const mockData = this.generateMockReportData(type, format);
    const blob = new Blob([mockData], {
      type: this.getMimeType(format)
    });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      id: Math.random().toString(36).substr(2, 9),
      filename,
      downloadUrl,
      createdAt: new Date().toISOString(),
    };
  }

  private generateMockReportData(type: ReportType, format: string): string {
    if (format === 'csv') {
      return this.generateMockCSV(type);
    } else if (format === 'excel') {
      return this.generateMockExcel(type);
    } else {
      return this.generateMockPDF(type);
    }
  }

  private generateMockCSV(type: ReportType): string {
    switch (type) {
      case 'time-tracking':
        return `Date,Project,Task,User,Hours,Description
2024-01-15,Website Redesign,Homepage Layout,John Doe,4.5,Created new homepage layout
2024-01-15,Mobile App,User Authentication,Jane Smith,3.2,Implemented login system
2024-01-16,Website Redesign,Navigation Menu,John Doe,2.8,Updated navigation structure
2024-01-16,API Development,User Endpoints,Mike Johnson,6.1,Created user management APIs`;

      case 'project-summary':
        return `Project,Total Hours,Tasks Completed,Team Members,Status
Website Redesign,45.5,12,3,In Progress
Mobile App,67.2,18,4,In Progress
API Development,23.8,8,2,Completed
Database Migration,12.5,5,1,Completed`;

      case 'user-activity':
        return `User,Total Hours,Tasks Completed,Average Hours/Day,Efficiency
John Doe,156.5,23,7.8,92%
Jane Smith,142.0,19,7.1,89%
Mike Johnson,98.5,15,6.2,85%
Sarah Wilson,87.0,12,5.8,88%`;

      default:
        return 'No data available';
    }
  }

  private generateMockExcel(type: ReportType): string {
    // For demo purposes, return CSV data with Excel headers
    return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report">
<Table>
${this.generateMockCSV(type).split('\n').map(line =>
  `<Row>${line.split(',').map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}</Row>`
).join('\n')}
</Table>
</Worksheet>
</Workbook>`;
  }

  private generateMockPDF(type: ReportType): string {
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(${type.toUpperCase()} REPORT) Tj
0 -20 Td
(Generated on ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000079 00000 n
0000000173 00000 n
0000000301 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
456
%%EOF`;
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.ms-excel';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }
}

export const reportService = new ReportService();