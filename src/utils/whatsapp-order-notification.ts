import axios from 'axios';
import Logger from 'src/logger';

const logger = new Logger();

export const newOrderNotification = async (data: {
  customer_name: string;
  reservation_date: string;
  service_name: string;
  order_id: string;
}) => {
  try {
    logger.log('Sending WhatsApp notification...');
    await sendToWhatsapp(data);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw new Error('Failed to send WhatsApp notification');
  }
};

export const sendToWhatsapp = async (data: {
  customer_name: string;
  reservation_date: string;
  service_name: string;
  order_id: string;
}) => {
  await axios.post(
    `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '+628986108839',
      type: 'template',
      template: {
        name: 'order_notification',
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: data.customer_name,
              },
              {
                type: 'text',
                text: data.reservation_date,
              },
              {
                type: 'text',
                text: data.service_name,
              },
            ],
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  );
};
