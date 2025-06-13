import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import {
  CreateReservationDto,
  ReservationResponseDto,
  PaginatedReservationsDto,
  FindAllReservationsQueryDto,
} from 'src/dto';
import {
  parse,
  isValid,
  isFuture,
  startOfHour,
  addHours,
  format,
} from 'date-fns';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async create(input: CreateReservationDto): Promise<ReservationResponseDto> {
    return this.reservationRepository.manager.transaction(async (manager) => {
      const { name, email, phoneNumber, date, time, guests, notes } = input;

      // Validate date and time
      const reservationDateTime = parse(
        `${date} ${time}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );
      if (!isValid(reservationDateTime)) {
        throw new BadRequestException('Invalid date or time format');
      }
      if (!isFuture(reservationDateTime)) {
        throw new BadRequestException('Reservation must be in the future');
      }

      // Validate time within operating hours (10:00–22:00)
      const [hour] = time.split(':').map(Number);
      if (hour < 10 || hour >= 22) {
        throw new BadRequestException(
          'Reservations only accepted between 10:00 and 22:00',
        );
      }

      // Check for existing reservation
      const existingReservation = await manager.findOne(Reservation, {
        where: { date, time, email, phoneNumber },
      });
      if (existingReservation) {
        throw new ConflictException(
          'Reservation already exists for this date, time, email, and phone number',
        );
      }

      // Check capacity (max 50 guests per 1-hour slot)
      const timeSlotStart = startOfHour(reservationDateTime);
      const timeSlotEnd = addHours(timeSlotStart, 1);
      const reservationsInSlot = await manager
        .createQueryBuilder(Reservation, 'reservation')
        .where('reservation.date = :date', { date })
        .andWhere('reservation.time >= :startTime', {
          startTime: format(timeSlotStart, 'HH:mm'),
        })
        .andWhere('reservation.time < :endTime', {
          endTime: format(timeSlotEnd, 'HH:mm'),
        })
        .andWhere('reservation.status != :cancelled', {
          cancelled: 'cancelled',
        })
        .getMany();

      const totalGuestsInSlot = reservationsInSlot.reduce(
        (sum, res) => sum + res.guests,
        0,
      );
      if (totalGuestsInSlot + guests > 50) {
        throw new BadRequestException('Capacity exceeded for this time slot');
      }

      // Create reservation
      const reservation = manager.create(Reservation, {
        name,
        email,
        phoneNumber,
        date,
        time,
        guests,
        notes,
        status: 'pending',
      });

      const savedReservation = await manager.save(reservation);

      return {
        id: savedReservation.id,
        name: savedReservation.name,
        email: savedReservation.email,
        phoneNumber: savedReservation.phoneNumber,
        date: savedReservation.date,
        time: savedReservation.time,
        guests: savedReservation.guests,
        notes: savedReservation.notes,
        status: savedReservation.status,
        createdAt: savedReservation.createdAt,
        updatedAt: savedReservation.updatedAt,
      };
    });
  }

  async findAll(
    query: FindAllReservationsQueryDto,
  ): Promise<PaginatedReservationsDto> {
    const { page, limit, startDate, endDate, email } = query;

    // Validate page and limit
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    // Validate date range
    if (startDate && endDate) {
      const start = parse(startDate, 'yyyy-MM-dd', new Date());
      const end = parse(endDate, 'yyyy-MM-dd', new Date());
      if (!isValid(start) || !isValid(end)) {
        throw new BadRequestException('Invalid startDate or endDate format');
      }
      if (start > end) {
        throw new BadRequestException(
          'startDate must be before or equal to endDate',
        );
      }
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const queryBuilder = this.reservationRepository
      .createQueryBuilder('reservation')
      .orderBy('reservation.createdAt', 'DESC'); // Sort by most recent

    // Apply date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere(
        'reservation.date BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    // Apply email filter
    if (email) {
      queryBuilder.andWhere('reservation.email = :email', { email });
    }

    // Apply pagination
    const [reservations, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: reservations.map((res) => ({
        id: res.id,
        name: res.name,
        email: res.email,
        phoneNumber: res.phoneNumber,
        date: res.date,
        time: res.time,
        guests: res.guests,
        notes: res.notes,
        status: res.status,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });
    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }
    return {
      id: reservation.id,
      name: reservation.name,
      email: reservation.email,
      phoneNumber: reservation.phoneNumber,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      notes: reservation.notes,
      status: reservation.status,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }

  async cancel(id: string): Promise<ReservationResponseDto> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });
    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }
    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation already cancelled');
    }
    reservation.status = 'cancelled';
    const updated = await this.reservationRepository.save(reservation);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      date: updated.date,
      time: updated.time,
      guests: updated.guests,
      notes: updated.notes,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
