import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto, UpdateEventDto, PaginatedResponse } from 'src/dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/supabase';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async create(
    input: CreateEventDto,
    image?: Express.Multer.File,
  ): Promise<Event> {
    try {
      // Validate event date
      const eventDate = new Date(input.eventDate);
      if (isNaN(eventDate.getTime())) {
        throw new BadRequestException('Invalid event date format');
      }

      // Validate event end date if provided
      let eventEndDate: Date | undefined;
      if (input.eventEndDate) {
        eventEndDate = new Date(input.eventEndDate);
        if (isNaN(eventEndDate.getTime())) {
          throw new BadRequestException('Invalid event end date format');
        }
        if (eventEndDate < eventDate) {
          throw new BadRequestException(
            'Event end date must be after event start date',
          );
        }
      }

      // Handle image upload
      let imageUrl: string | undefined;
      if (image) {
        const filePath = `events/${Date.now()}_${image.originalname}`;
        const { data, error } = await this.supabaseClient.storage
          .from('menu-items') // You may want to create a separate 'events' bucket
          .upload(filePath, image.buffer, {
            contentType: image.mimetype,
          });

        if (error) {
          throw new InternalServerErrorException('Failed to upload image');
        }

        const { data: publicUrlData } = this.supabaseClient.storage
          .from('menu-items')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl;
      }

      // Create event
      const event = this.eventRepository.create({
        title: input.title,
        description: input.description,
        location: input.location,
        eventDate,
        eventEndDate,
        imageUrl,
        isPublished:
          input.isPublished !== undefined ? input.isPublished : true,
        organizer: input.organizer,
        ticketPrice: input.ticketPrice,
        ticketLink: input.ticketLink,
        capacity: input.capacity,
      });

      return await this.eventRepository.save(event);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    includeUnpublished: boolean = false,
  ): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .orderBy('event.eventDate', 'ASC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (!includeUnpublished) {
      queryBuilder.andWhere('event.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    // Get entities and total count
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  async findUpcoming(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.eventDate >= :now', { now })
      .andWhere('event.isPublished = :isPublished', { isPublished: true })
      .orderBy('event.eventDate', 'ASC')
      .skip(skip)
      .take(limit);

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    // Get entities and total count
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  async findPast(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResponse<Event>> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.eventDate < :now', { now })
      .andWhere('event.isPublished = :isPublished', { isPublished: true })
      .orderBy('event.eventDate', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    // Get entities and total count
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found.`);
    }

    return event;
  }

  async update(
    id: string,
    input: UpdateEventDto,
    image?: Express.Multer.File,
  ): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found.`);
    }

    // Validate event date if provided
    let eventDate: Date | undefined;
    if (input.eventDate) {
      eventDate = new Date(input.eventDate);
      if (isNaN(eventDate.getTime())) {
        throw new BadRequestException('Invalid event date format');
      }
    }

    // Validate event end date if provided
    let eventEndDate: Date | undefined;
    if (input.eventEndDate) {
      eventEndDate = new Date(input.eventEndDate);
      if (isNaN(eventEndDate.getTime())) {
        throw new BadRequestException('Invalid event end date format');
      }

      const compareDate = eventDate || event.eventDate;
      if (eventEndDate < compareDate) {
        throw new BadRequestException(
          'Event end date must be after event start date',
        );
      }
    }

    // Handle image update
    if (image) {
      const filePath = `events/${Date.now()}_${image.originalname}`;
      const { data, error } = await this.supabaseClient.storage
        .from('menu-items')
        .upload(filePath, image.buffer, {
          contentType: image.mimetype,
        });

      if (error) {
        throw new InternalServerErrorException('Failed to upload image');
      }

      const { data: publicUrlData } = this.supabaseClient.storage
        .from('menu-items')
        .getPublicUrl(filePath);

      event.imageUrl = publicUrlData?.publicUrl;
    }

    // Assign fields
    Object.assign(event, {
      title: input.title ?? event.title,
      description: input.description ?? event.description,
      location: input.location ?? event.location,
      eventDate: eventDate ?? event.eventDate,
      eventEndDate: eventEndDate ?? event.eventEndDate,
      isPublished: input.isPublished ?? event.isPublished,
      organizer: input.organizer ?? event.organizer,
      ticketPrice: input.ticketPrice ?? event.ticketPrice,
      ticketLink: input.ticketLink ?? event.ticketLink,
      capacity: input.capacity ?? event.capacity,
    });

    return await this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found.`);
    }

    await this.eventRepository.delete(id);
  }

  async isEventPast(id: string): Promise<boolean> {
    const event = await this.findOne(id);
    const now = new Date();

    // If event has an end date, use that; otherwise use the start date
    const compareDate = event.eventEndDate || event.eventDate;

    return compareDate < now;
  }
}

