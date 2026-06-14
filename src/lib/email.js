import emailjs from '@emailjs/browser';

const SERVICE_ID       = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const PUBLIC_KEY       = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
const BOOKING_TEMPLATE = process.env.REACT_APP_EMAILJS_BOOKING_TEMPLATE_ID;

export async function sendBookingEmailToRenter({ renterName, renterEmail, carName, startDate, endDate, days, total }) {
  try {
    await emailjs.send(
      SERVICE_ID,
      BOOKING_TEMPLATE,
      {
        to_name:     renterName,
        to_email:    renterEmail,
        subject:     `Your booking for ${carName} is confirmed! 🚗`,
        message:     `Great news! Your booking request for ${carName} has been received and is pending owner confirmation.`,
        car_name:    carName,
        start_date:  startDate,
        end_date:    endDate,
        days:        days,
        total:       `₦${Number(total).toLocaleString()}`,
        action_note: 'You will receive another email once the owner confirms your booking.',
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error('Failed to send renter email:', err);
  }
}

export async function sendBookingEmailToOwner({ ownerName, ownerEmail, renterName, carName, startDate, endDate, days, total }) {
  try {
    await emailjs.send(
      SERVICE_ID,
      BOOKING_TEMPLATE,
      {
        to_name:     ownerName,
        to_email:    ownerEmail,
        subject:     `New booking request for your ${carName} 🔑`,
        message:     `${renterName} has requested to book your ${carName}. Log in to accept or decline.`,
        car_name:    carName,
        start_date:  startDate,
        end_date:    endDate,
        days:        days,
        total:       `₦${Number(total).toLocaleString()}`,
        action_note: 'Log in to your DriveGO dashboard to accept or decline this booking.',
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error('Failed to send owner email:', err);
  }
}

export async function sendBookingStatusEmail({ renterName, renterEmail, carName, status, startDate, endDate }) {
  const isConfirmed = status === 'confirmed';
  try {
    await emailjs.send(
      SERVICE_ID,
      BOOKING_TEMPLATE,
      {
        to_name:     renterName,
        to_email:    renterEmail,
        subject:     isConfirmed
          ? `Your booking for ${carName} is confirmed! ✅`
          : `Your booking for ${carName} was declined ❌`,
        message:     isConfirmed
          ? `Great news! The owner has confirmed your booking for ${carName}.`
          : `Unfortunately the owner has declined your booking for ${carName}.`,
        car_name:    carName,
        start_date:  startDate,
        end_date:    endDate,
        days:        '',
        total:       '',
        action_note: isConfirmed
          ? 'Please make sure to pick up the car on time. Enjoy your ride!'
          : 'You can browse other available cars on DriveGO.',
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error('Failed to send status email:', err);
  }
}

export async function sendMessageNotificationEmail({ toName, toEmail, fromName, message, chatLink }) {
  try {
    await emailjs.send(
      SERVICE_ID,
      BOOKING_TEMPLATE,
      {
        to_name:     toName,
        to_email:    toEmail,
        subject:     `💬 New message from ${fromName} on DriveGO`,
        message:     message.length > 100 ? message.slice(0, 100) + '...' : message,
        car_name:    '',
        start_date:  '',
        end_date:    '',
        days:        '',
        total:       '',
        action_note: `Log in to reply at your DriveGO messages`,
      },
      PUBLIC_KEY
    );
  } catch (err) {
    console.error('Failed to send message notification email:', err);
  }
}