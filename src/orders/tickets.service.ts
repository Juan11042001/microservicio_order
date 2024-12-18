import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { OrdersService } from './orders.service';

const fonts = {
  Roboto: {
    normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
    bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
    italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
    bolditalics:
      'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf',
  },
};
@Injectable()
export class TicketsService {
  private readonly printer = new PdfPrinter(fonts);
  constructor(private readonly ordersService: OrdersService) {}
  async generateTickets(orderId: string) {
    const data = await this.ordersService.findOne(orderId);

    const eventStartDate = new Date(data.ticketType.event.startDate);
    const formattedDate = eventStartDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generar múltiples páginas de tickets según la cantidad
    const ticketPages = [];
    for (let i = 0; i < data.orderDetails[0].quantity; i++) {
      ticketPages.push({
        stack: [
          {
            text: 'ENTRADA',
            style: 'ticketHeader',
            margin: [0, 0, 0, 10],
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'Evento:', style: 'label' },
                  { text: data.ticketType.event.name, style: 'value' },
                ],
              },
              {
                width: '*',
                stack: [
                  { text: 'Tipo de Ticket:', style: 'label' },
                  { text: data.ticketType.name, style: 'value' },
                ],
              },
            ],
            margin: [0, 0, 0, 10],
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'Fecha:', style: 'label' },
                  { text: formattedDate, style: 'value' },
                ],
              },
              {
                width: '*',
                stack: [
                  { text: 'Hora:', style: 'label' },
                  {
                    text: eventStartDate.toLocaleTimeString('es-ES'),
                    style: 'value',
                  },
                ],
              },
            ],
            margin: [0, 0, 0, 10],
          },
          {
            qr: data.id, // Código QR con ID de la orden
            fit: 100,
            alignment: 'center',
            margin: [0, 10, 0, 10],
          },
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 515,
                y2: 0,
                lineWidth: 1,
                lineCap: 'round',
                dash: { length: 5 },
              },
            ],
            margin: [0, 10, 0, 10],
          },
          {
            text: `Ticket #${i + 1} de ${data.orderDetails[0].quantity}`,
            alignment: 'center',
            style: 'ticketFooter',
          },
        ],
        style: 'ticketContainer',
      });
    }

    const documentDefinition: TDocumentDefinitions = {
      content: ticketPages,
      styles: {
        ticketContainer: {
          margin: [40, 20],
        },
        ticketHeader: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#333333',
        },
        label: {
          fontSize: 10,
          color: '#666666',
        },
        value: {
          fontSize: 12,
          bold: true,
          color: '#000000',
        },
        ticketFooter: {
          fontSize: 10,
          color: '#666666',
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
      pageSize: 'A5',
      pageOrientation: 'portrait',
    };

    return this.printer.createPdfKitDocument(documentDefinition);
  }
}
