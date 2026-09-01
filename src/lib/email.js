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

const STATUS_EMAIL_COPY = {
  confirmed: {
    subject:     (car) => `Your booking for ${car} is confirmed! ✅`,
    message:     (car) => `Great news! The owner has confirmed your booking for ${car}. They're getting the car ready for you.`,
    action_note: 'You will be notified as soon as the car is dispatched to your location.',
  },
  declined: {
    subject:     (car) => `Your booking for ${car} was declined ❌`,
    message:     (car) => `Unfortunately the owner has declined your booking for ${car}.`,
    action_note: 'You can browse other available cars on DriveGO. Contact support if you already paid and need a refund.',
  },
  dispatched: {
    subject:     (car) => `${car} is on its way 🚚`,
    message:     (car) => `Your car, ${car}, has been dispatched and is on its way to your location.`,
    action_note: 'Please be available to receive the car and confirm its condition.',
  },
  delivered: {
    subject:     (car) => `${car} has been delivered — enjoy your trip! 🚗`,
    message:     (car) => `${car} has been delivered to you. Enjoy your trip!`,
    action_note: 'Please take care of the car and return it as agreed at the end of your trip.',
  },
  completed: {
    subject:     (car) => `Your trip with ${car} is complete ✅`,
    message:     (car) => `Your trip with ${car} has been marked complete. We hope you enjoyed it!`,
    action_note: 'You can now leave a review from your dashboard.',
  },
};

export async function sendBookingStatusEmail({ renterName, renterEmail, carName, status, startDate, endDate }) {
  const copy = STATUS_EMAIL_COPY[status];
  if (!copy) return;
  try {
    await emailjs.send(
      SERVICE_ID,
      BOOKING_TEMPLATE,
      {
        to_name:     renterName,
        to_email:    renterEmail,
        subject:     copy.subject(carName),
        message:     copy.message(carName),
        car_name:    carName,
        start_date:  startDate,
        end_date:    endDate,
        days:        '',
        total:       '',
        action_note: copy.action_note,
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