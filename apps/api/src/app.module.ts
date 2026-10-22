import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
<<<<<<< HEAD
import { ContactsModule } from './modules/contacts/contacts.module';
=======
import { CompaniesModule } from './modules/companies/companies.module';
>>>>>>> dev

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    LeadsModule,
<<<<<<< HEAD
    ContactsModule,
=======
    CompaniesModule,
>>>>>>> dev
  ],
})
export class AppModule {}
