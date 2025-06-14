import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Parser } from 'json2csv';
import * as PDFDocument from 'pdfkit';
import { format } from 'date-fns';

import {
  GenerateReportDto,
  ReportType,
  ReportFormat,
  ReportResponse,
  OrderReport,
  ReservationReport,
  InventoryReport,
} from 'src/dto';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Reservation } from 'src/reservations/entities/reservation.entity';
import { EmailService } from 'src/utils';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private readonly mailService: EmailService,
  ) {}

  async generateReport(
    dto: GenerateReportDto,
  ): Promise<{ data?: ReportResponse; buffer?: Buffer; message?: string }> {
    console.log('Generating report:', {
      ...dto,
      timestamp: new Date().toISOString(),
    });

    const { type, startDate, endDate, format, emailRecipients } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let report: ReportResponse;
    let buffer: Buffer | undefined;

    switch (type) {
      case ReportType.ORDERS:
        report = await this.generateOrderReport(start, end);
        break;
      case ReportType.RESERVATIONS:
        report = await this.generateReservationReport(start, end);
        break;
      case ReportType.INVENTORY:
        report = await this.generateInventoryReport();
        break;
      default:
        throw new Error('Invalid report type');
    }

    if (format === ReportFormat.JSON && !emailRecipients) {
      return { data: report };
    }

    if (format === ReportFormat.CSV) {
      buffer = await this.generateCsvBuffer(report);
    } else if (format === ReportFormat.PDF) {
      buffer = await this.generatePdfBuffer(report);
    } else if (emailRecipients && format === ReportFormat.JSON) {
      throw new Error('JSON format cannot be emailed');
    }

    if (emailRecipients && emailRecipients.length > 0) {
      if (!buffer) {
        throw new Error('Buffer not generated for email');
      }
      await this.sendReportEmail(dto, report, buffer);
      return {
        message: `Report sent successfully to ${emailRecipients.join(', ')}`,
      };
    }

    return { data: report, buffer };
  }

  private async generateOrderReport(
    start: Date,
    end: Date,
  ): Promise<OrderReport> {
    const orders = await this.orderRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      select: ['id', 'customer', 'totalPrice', 'status', 'createdAt'],
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + parseFloat(o.totalPrice as any),
      0,
    );
    const statusBreakdown = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      {} as { [status: string]: number },
    );

    return {
      totalOrders,
      totalRevenue,
      statusBreakdown,
      orders: orders.map((o) => ({
        id: o.id,
        customerName: o.customer.fullName,
        totalPrice: o.totalPrice,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  private async generateReservationReport(
    start: Date,
    end: Date,
  ): Promise<ReservationReport> {
    const startDateStr = format(start, 'yyyy-MM-dd');
    const endDateStr = format(end, 'yyyy-MM-dd');

    const reservations = await this.reservationRepository.find({
      where: {
        createdAt: Between(start, end),
        date: Between(startDateStr, endDateStr),
      },
      select: [
        'id',
        'name',
        'email',
        'date',
        'time',
        'guests',
        'status',
        'createdAt',
      ],
    });

    const totalReservations = reservations.length;
    const totalGuests = reservations.reduce((sum, r) => sum + r.guests, 0);
    const statusBreakdown = reservations.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as { [status: string]: number },
    );

    return {
      totalReservations,
      totalGuests,
      statusBreakdown,
      reservations: reservations.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        date: r.date,
        time: r.time,
        guests: r.guests,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  private async generateInventoryReport(): Promise<InventoryReport> {
    const items = await this.inventoryRepository.find({
      select: ['id', 'itemName', 'quantity', 'unit', 'unitPrice', 'status'],
    });

    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    const lowStockItems = items.filter((i) => i.status === 'low_stock').length;
    const outOfStockItems = items.filter(
      (i) => i.status === 'out_of_stock',
    ).length;
    const statusBreakdown = items.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      {} as { [status: string]: number },
    );

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      statusBreakdown,
      items: items.map((i) => ({
        id: i.id,
        itemName: i.itemName,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        totalValue: i.quantity * i.unitPrice,
        status: i.status,
      })),
    };
  }

  private async generateCsvBuffer(report: ReportResponse): Promise<Buffer> {
    let fields: string[];
    let data: any[];

    if ('orders' in report) {
      fields = ['id', 'customerName', 'totalPrice', 'status', 'createdAt'];
      data = report.orders;
    } else if ('reservations' in report) {
      fields = [
        'id',
        'name',
        'email',
        'date',
        'time',
        'guests',
        'status',
        'createdAt',
      ];
      data = report.reservations;
    } else {
      fields = [
        'id',
        'itemName',
        'quantity',
        'unit',
        'unitPrice',
        'totalValue',
        'status',
      ];
      data = report.items;
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    return Buffer.from(csv);
  }

  private async generatePdfBuffer(report: ReportResponse): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const title =
        'orders' in report
          ? 'Orders Report'
          : 'reservations' in report
            ? 'Reservations Report'
            : 'Inventory Report';
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Summary
      if ('orders' in report) {
        doc.fontSize(14).text(`Total Orders: ${report.totalOrders}`);
        doc.text(`Total Revenue: ₦${report.totalRevenue}`);
        doc.text('Status Breakdown:');
        Object.entries(report.statusBreakdown).forEach(([status, count]) => {
          doc.text(`  ${status}: ${count}`);
        });
      } else if ('reservations' in report) {
        doc
          .fontSize(14)
          .text(`Total Reservations: ${report.totalReservations}`);
        doc.text(`Total Guests: ${report.totalGuests}`);
        doc.text('Status Breakdown:');
        Object.entries(report.statusBreakdown).forEach(([status, count]) => {
          doc.text(`  ${status}: ${count}`);
        });
      } else {
        doc.fontSize(14).text(`Total Items: ${report.totalItems}`);
        doc.text(`Total Value: ₦${report.totalValue}`);
        doc.text(`Low Stock Items: ${report.lowStockItems}`);
        doc.text(`Out of Stock Items: ${report.outOfStockItems}`);
        doc.text('Status Breakdown:');
        Object.entries(report.statusBreakdown).forEach(([status, count]) => {
          doc.text(`  ${status}: ${count}`);
        });
      }

      doc.moveDown();
      doc.fontSize(12).text('Details:', { underline: true });
      doc.moveDown();

      // Table Headers
      let headers: string[];
      let rows: any[];
      if ('orders' in report) {
        headers = ['ID', 'Customer', 'Total (₦)', 'Status', 'Created At'];
        rows = report.orders.map((o) => [
          o.id.slice(0, 8),
          o.customerName,
          o.totalPrice,
          o.status,
          format(new Date(o.createdAt), 'yyyy-MM-dd'),
        ]);
      } else if ('reservations' in report) {
        headers = ['ID', 'Name', 'Email', 'Date', 'Time', 'Guests', 'Status'];
        rows = report.reservations.map((r) => [
          r.id.slice(0, 8),
          r.name,
          r.email,
          r.date,
          r.time,
          r.guests,
          r.status,
        ]);
      } else {
        headers = [
          'ID',
          'Item',
          'Quantity',
          'Unit',
          'Unit Price (₦)',
          'Total (₦)',
          'Status',
        ];
        rows = report.items.map((i) => [
          i.id.slice(0, 8),
          i.itemName,
          i.quantity,
          i.unit,
          i.unitPrice,
          i.totalValue,
          i.status,
        ]);
      }

      // Simple table layout
      const tableTop = doc.y;
      const cellPadding = 5;
      const colWidths = headers.map(() => 100); // Equal width for simplicity
      let rowHeight = 20;

      // Headers
      headers.forEach((header, i) => {
        doc.text(header, 50 + i * colWidths[i], tableTop, {
          width: colWidths[i],
          align: 'left',
        });
      });
      doc.moveDown(0.5);

      // Rows
      rows.forEach((row, rowIndex) => {
        const y = tableTop + (rowIndex + 1) * rowHeight;
        row.forEach((cell: string, i: number) => {
          doc.text(cell, 50 + i * colWidths[i], y, {
            width: colWidths[i],
            align: 'left',
          });
        });
      });

      doc.end();
    });
  }

  private async sendReportEmail(
    dto: GenerateReportDto,
    report: ReportResponse,
    buffer: Buffer,
  ) {
    const { type, format, emailRecipients } = dto;

    const subject = `${type.charAt(0).toUpperCase() + type.slice(1)} Report (${dto.startDate} to ${dto.endDate})`;
    const attachmentName = `${type}-report-${dto.startDate}-${dto.endDate}.${format.toLowerCase()}`;

    await this.mailService.sendMail({
      from: 'royalbistro@gmail.com',
      to: emailRecipients!.join(', '),
      subject,
      text: `Please find attached the ${type} report for the period ${dto.startDate} to ${dto.endDate}.`,
      attachments: [
        {
          filename: attachmentName,
          content: buffer,
          contentType:
            format === ReportFormat.CSV ? 'text/csv' : 'application/pdf',
        },
      ],
    });
  }
}
