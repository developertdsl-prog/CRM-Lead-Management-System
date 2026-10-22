import { CsvService } from './csv.service';
import { LeadPriority, LeadSource, LeadStatus } from '@crm/shared-types';

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(() => {
    service = new CsvService();
  });

  describe('parseLeadCsv', () => {
    it('should parse valid CSV data with header aliases and types', () => {
      const csv = `First Name,Last Name,Email Address,Phone,Company,Job Title,Estimated Value
Sarah,Connor,sarah@cyberdyne.io,+15550192834,Cyberdyne Systems,COO,50000
John,Reese,john@vigilance.net,+15550198888,Vigilance Corp,Security Lead,35000`;

      const result = service.parseLeadCsv(csv);

      expect(result.errors.length).toBe(0);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].firstName).toBe('Sarah');
      expect(result.rows[0].lastName).toBe('Connor');
      expect(result.rows[0].email).toBe('sarah@cyberdyne.io');
      expect(result.rows[0].companyName).toBe('Cyberdyne Systems');
      expect(result.rows[0].estimatedValue).toBe(50000);
      expect(result.rows[1].firstName).toBe('John');
    });

    it('should handle quoted fields containing commas', () => {
      const csv = `First Name,Last Name,Company,Estimated Value
"Robert, Jr.",Downey,"Stark Industries, Inc.",100000`;

      const result = service.parseLeadCsv(csv);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].firstName).toBe('Robert, Jr.');
      expect(result.rows[0].companyName).toBe('Stark Industries, Inc.');
      expect(result.rows[0].estimatedValue).toBe(100000);
    });

    it('should flag rows with missing first or last name', () => {
      const csv = `First Name,Last Name,Email
,Solo,han@falcon.com
Luke,,luke@jedi.org`;

      const result = service.parseLeadCsv(csv);

      expect(result.rows.length).toBe(0);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toContain('Missing mandatory firstName or lastName');
    });
  });

  describe('generateLeadCsv', () => {
    it('should generate standard CSV with proper header and escaped values', () => {
      const leads = [
        {
          id: 'lead-1',
          firstName: 'Tony',
          lastName: 'Stark',
          email: 'tony@stark.com',
          phone: '+1-555-0100',
          companyName: 'Stark Industries, LLC',
          jobTitle: 'CEO',
          source: LeadSource.WEBSITE,
          status: LeadStatus.QUALIFIED,
          priority: LeadPriority.HIGH,
          score: 95,
          estimatedValue: 250000,
          currency: 'USD',
          owner: { firstName: 'Pepper', lastName: 'Potts' },
          createdAt: new Date('2026-01-01'),
        },
      ];

      const csv = service.generateLeadCsv(leads);

      expect(csv).toContain('ID,First Name,Last Name,Email,Phone,Company Name');
      expect(csv).toContain('"Stark Industries, LLC"');
      expect(csv).toContain('Pepper Potts');
    });
  });
});
