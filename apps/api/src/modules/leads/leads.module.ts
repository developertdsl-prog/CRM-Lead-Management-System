import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { DeduplicationService } from './deduplication.service';
import { CsvService } from './csv.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController],
  providers: [LeadsService, DeduplicationService, CsvService],
  exports: [LeadsService, DeduplicationService, CsvService],
})
export class LeadsModule {}
