import { useNavigate } from 'react-router-dom';
import styles from './CarCard.module.css';

const TYPE_EMOJI = { Sedan: '🚗', SUV: '🚙', Luxury: '🏎️', Van: '🚐' };

export default function CarCard({ car, onBook }) {
  const navigate = useNavigate();

  return (
    <div className={styles.card}>
      <div
        className={styles.img}
        onClick={() => navigate(`/cars/${car.id}`)}
        style={{ cursor: 'pointer' }}
      >
        {car.image_url
          ? <img src={car.image_url} alt={car.name} className={styles.photo} />
          : <span>{TYPE_EMOJI[car.type] || '🚗'}</span>
        }
        <span className={styles.typeBadge}>{car.type}</span>
      </div>
      <div className={styles.info}>
        <div
          className={styles.name}
          onClick={() => navigate(`/cars/${car.id}`)}
          style={{ cursor: 'pointer' }}
        >
          {car.name}
        </div>
        <div className={styles.sub}>{car.brand} · {car.city} · {car.year}</div>
        <div className={styles.footer}>
          <div className={styles.price}>
            ₦{Number(car.price).toLocaleString()} <span>/ day</span>
          </div>
          <button className={styles.bookBtn} onClick={() => onBook(car)}>
            Book now
          </button>
        </div>
      </div>
    </div>
  );
}