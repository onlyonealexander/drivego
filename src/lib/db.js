import { supabase } from './supabase';
import { sendBookingEmailToRenter, sendBookingEmailToOwner, sendBookingStatusEmail } from './email';

// ── CARS ──────────────────────────────────────────

export async function getCars({ brand, type, city, search } = {}) {
  let query = supabase
    .from('cars')
    .select('*, profiles(name, phone)')
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (brand)  query = query.eq('brand', brand);
  if (type)   query = query.eq('type', type);
  if (city)   query = query.eq('city', city);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getOwnerCars(ownerId) {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCar(carData) {
  const { data, error } = await supabase
    .from('cars')
    .insert([carData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCar(carId, updates) {
  const { data, error } = await supabase
    .from('cars')
    .update(updates)
    .eq('id', carId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCar(carId) {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId);
  if (error) throw error;
}

// ── BOOKINGS ──────────────────────────────────────

export async function getRenterBookings(renterId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, cars(name, city, price, image_url)')
    .eq('renter_id', renterId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOwnerBookings(ownerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, cars(name, city), profiles!bookings_renter_id_fkey(name, phone)`)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBooking(bookingData) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();
  if (error) throw error;

  // Mark car as unavailable
  await supabase
    .from('cars')
    .update({ available: false })
    .eq('id', bookingData.car_id);

  try {
    const { data: car } = await supabase
      .from('cars')
      .select('name')
      .eq('id', bookingData.car_id)
      .single();

    const { data: renter } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', bookingData.renter_id)
      .single();

    const { data: owner } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', bookingData.owner_id)
      .single();

    const days = Math.ceil(
      (new Date(bookingData.end_date) - new Date(bookingData.start_date))
      / (1000 * 60 * 60 * 24)
    );

    // Email renter
    await sendBookingEmailToRenter({
      renterName:  renter?.name,
      renterEmail: renter?.email,
      carName:     car?.name,
      startDate:   bookingData.start_date,
      endDate:     bookingData.end_date,
      days,
      total:       bookingData.total_price,
    });

    // Email owner
    await sendBookingEmailToOwner({
      ownerName:  owner?.name,
      ownerEmail: owner?.email,
      renterName: renter?.name,
      carName:    car?.name,
      startDate:  bookingData.start_date,
      endDate:    bookingData.end_date,
      days,
      total:      bookingData.total_price,
    });

    // In-app notification to owner
    await createNotification(
      bookingData.owner_id,
      'New booking request 🚗',
      `${renter?.name || 'Someone'} wants to book your ${car?.name || 'car'} from ${bookingData.start_date} to ${bookingData.end_date}.`,
      'booking'
    );

  } catch (err) {
    console.error('Notification error:', err);
  }

  return data;
}

// Booking lifecycle: pending -> confirmed -> dispatched -> delivered -> completed
// (or pending -> declined). See supabase/schema.sql for the status check constraint.
const STATUS_NOTIFICATION_COPY = {
  confirmed:  { title: 'Booking confirmed! ✅',        message: (car) => `Your booking for ${car} has been confirmed. The owner is preparing your car.` },
  declined:   { title: 'Booking declined ❌',           message: (car) => `Your booking for ${car} was declined by the owner.` },
  dispatched: { title: 'Your car is on the way 🚚',     message: (car) => `${car} has been dispatched and is on its way to you.` },
  delivered:  { title: 'Car delivered — enjoy! 🚗',     message: (car) => `${car} has been delivered. Enjoy your trip!` },
  completed:  { title: 'Trip completed ✅',             message: (car) => `Your trip with ${car} is complete. We hope you enjoyed it!` },
};

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('*, cars(name), profiles!bookings_renter_id_fkey(name, email)')
    .single();
  if (error) throw error;

  // Declined or completed bookings free the car up again.
  if (status === 'declined' || status === 'completed') {
    await supabase
      .from('cars')
      .update({ available: true })
      .eq('id', data.car_id);
  }

  try {
    const copy = STATUS_NOTIFICATION_COPY[status];
    if (copy) {
      await sendBookingStatusEmail({
        renterName:  data.profiles?.name,
        renterEmail: data.profiles?.email,
        carName:     data.cars?.name,
        status,
        startDate:   data.start_date,
        endDate:     data.end_date,
      });

      await createNotification(
        data.renter_id,
        copy.title,
        copy.message(data.cars?.name || 'your car'),
        status
      );
    }
  } catch (err) {
    console.error('Notification error:', err);
  }

  return data;
}

// ── PROFILES ──────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── NOTIFICATIONS ──────────────────────────────────

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function createNotification(userId, title, message, type = 'info') {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, title, message, type }]);
  if (error) throw error;
}