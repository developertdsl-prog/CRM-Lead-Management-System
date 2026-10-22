import { Injectable, Logger } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadPriority, LeadSource, LeadStatus } from '@crm/shared-types';

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  /**
   * Parse CSV content into structured CreateLeadDto array
   */
  parseLeadCsv(csvContent: string): { rows: CreateLeadDto[]; errors: string[] } {
    const lines = this.splitCsvLines(csvContent);
    if (lines.length < 2) {
      return { rows: [], errors: ['CSV file must contain a header row and at least one data row'] };
    }

    const rawHeaders = this.parseCsvRow(lines[0]);
    const headerMap = this.mapHeaders(rawHeaders);

    const rows: CreateLeadDto[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCsvRow(line);
      try {
        const lead = this.mapRowToLeadDto(values, headerMap);
        if (!lead.firstName || !lead.lastName) {
          errors.push(`Row ${i + 1}: Missing mandatory firstName or lastName`);
          continue;
        }
        rows.push(lead);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    return { rows, errors };
  }

  /**
   * Generate RFC 4180 compliant CSV string from leads array
   */
  generateLeadCsv(leads: Array<Record<string, any>>): string {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company Name',
      'Job Title',
      'Source',
      'Status',
      'Priority',
      'Score',
      'Estimated Value',
      'Currency',
      'Owner Name',
      'Created At',
    ];

    const csvLines = [headers.join(',')];

    for (const lead of leads) {
      const ownerName = lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : '';
      const row = [
        this.escapeCsvValue(lead.id),
        this.escapeCsvValue(lead.firstName),
        this.escapeCsvValue(lead.lastName),
        this.escapeCsvValue(lead.email ?? ''),
        this.escapeCsvValue(lead.phone ?? ''),
        this.escapeCsvValue(lead.companyName ?? ''),
        this.escapeCsvValue(lead.jobTitle ?? ''),
        this.escapeCsvValue(lead.source ?? 'WEBSITE'),
        this.escapeCsvValue(lead.status ?? 'NEW'),
        this.escapeCsvValue(lead.priority ?? 'MEDIUM'),
        this.escapeCsvValue(lead.score ?? 0),
        this.escapeCsvValue(lead.estimatedValue ? Number(lead.estimatedValue) : ''),
        this.escapeCsvValue(lead.currency ?? 'USD'),
        this.escapeCsvValue(ownerName),
        this.escapeCsvValue(lead.createdAt ? new Date(lead.createdAt).toISOString() : ''),
      ];
      csvLines.push(row.join(','));
    }

    return csvLines.join('\r\n');
  }

  /**
   * Header mapping with aliases support
   */
  private mapHeaders(headers: string[]): Map<string, number> {
    const map = new Map<string, number>();

    const aliases: Record<string, string[]> = {
      firstName: ['first name', 'firstname', 'first', 'given name'],
      lastName: ['last name', 'lastname', 'last', 'surname', 'family name'],
      email: ['email', 'email address', 'e-mail'],
      phone: ['phone', 'phone number', 'telephone', 'mobile', 'mobile phone'],
      companyName: ['company', 'company name', 'organization', 'account'],
      jobTitle: ['job title', 'title', 'position', 'role'],
      source: ['source', 'lead source', 'channel'],
      status: ['status', 'lead status', 'stage'],
      priority: ['priority', 'lead priority', 'urgency'],
      score: ['score', 'lead score', 'points'],
      estimatedValue: ['estimated value', 'value', 'deal value', 'amount', 'budget'],
      currency: ['currency', 'currency code'],
    };

    headers.forEach((header, index) => {
      const cleanHeader = header.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
      for (const [key, aliasList] of Object.entries(aliases)) {
        if (aliasList.includes(cleanHeader)) {
          map.set(key, index);
          break;
        }
      }
    });

    return map;
  }

  private mapRowToLeadDto(values: string[], headerMap: Map<string, number>): CreateLeadDto {
    const getValue = (key: string): string | undefined => {
      const index = headerMap.get(key);
      if (index === undefined || index >= values.length) return undefined;
      const val = values[index]?.trim();
      return val === '' ? undefined : val;
    };

    const firstName = getValue('firstName') ?? '';
    const lastName = getValue('lastName') ?? '';
    const email = getValue('email');
    const phone = getValue('phone');
    const companyName = getValue('companyName');
    const jobTitle = getValue('jobTitle');
    const sourceStr = getValue('source')?.toUpperCase();
    const statusStr = getValue('status')?.toUpperCase();
    const priorityStr = getValue('priority')?.toUpperCase();
    const scoreStr = getValue('score');
    const valueStr = getValue('estimatedValue');
    const currency = getValue('currency') ?? 'USD';

    // Source validation
    const source = Object.values(LeadSource).includes(sourceStr as LeadSource)
      ? (sourceStr as LeadSource)
      : LeadSource.WEBSITE;

    // Status validation
    const status = Object.values(LeadStatus).includes(statusStr as LeadStatus)
      ? (statusStr as LeadStatus)
      : LeadStatus.NEW;

    // Priority validation
    const priority = Object.values(LeadPriority).includes(priorityStr as LeadPriority)
      ? (priorityStr as LeadPriority)
      : LeadPriority.MEDIUM;

    return {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      jobTitle,
      source,
      status,
      priority,
      score: scoreStr ? parseInt(scoreStr, 10) || 0 : 0,
      estimatedValue: valueStr ? parseFloat(valueStr) || 0 : undefined,
      currency,
    };
  }

  private splitCsvLines(csv: string): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && csv[i + 1] === '\n') {
          i++; // Skip \n in CRLF
        }
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    return lines;
  }

  private parseCsvRow(row: string): string[] {
    const values: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (insideQuotes && row[i + 1] === '"') {
          // Escaped quote
          currentVal += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }

    values.push(currentVal.trim());
    return values;
  }

  private escapeCsvValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
