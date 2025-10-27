import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { SupabaseProvider } from 'src/supabase';
import { Admin } from 'src/admin/entities/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Admin])],
  controllers: [EventsController],
  providers: [SupabaseProvider, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
