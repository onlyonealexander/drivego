import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import CarCard from '../components/CarCard';
import AuthModal from '../components/AuthModal';
import BookingModal from '../components/BookingModal';
import { getCars } from '../lib/db';
import styles from './HomePage.module.css';
import { SkeletonCard } from '../components/Skeleton';

const brands     = ['All Brands', 'Toyota', 'Honda', 'Mercedes', 'BMW', 'Lexus', 'Kia', 'Hyundai', 'Ford'];
const categories = ['All Types', 'Sedan', 'SUV', 'Luxury', 'Van'];
const cities     = ['All Cities', 'Lagos', 'Abuja', 'PH'];

export default function HomePage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalIntent, setModalIntent] = useState('signin');
  const [cars, setCars]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [selectedType, setSelectedType]   = useState('All Types');
  const [selectedCity, setSelectedCity]   = useState('All Cities');
  const [sortBy, setSortBy]               = useState('default');
  const [search, setSearch]               = useState('');

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCars({
        brand:  selectedBrand !== 'All Brands' ? selectedBrand : undefined,
        type:   selectedType  !== 'All Types'  ? selectedType  : undefined,
        city:   selectedCity  !== 'All Cities' ? selectedCity  : undefined,
        search: search.trim() || undefined,
      });
      let result = [...data];
      if (sortBy === 'price-asc')  result.sort((a, b) => a.price - b.price);
      if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
      if (sortBy === 'newest')     result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCars(result);
    } catch (err) {
      setError('Failed to load cars. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, selectedType, selectedCity, search, sortBy]);

  useEffect(() => {
    const timer = setTimeout(fetchCars, 300);
    return () => clearTimeout(timer);
  }, [fetchCars]);

  const handleBook = (car) => {
    if (!user) {
      setModalIntent('book');
      setModalOpen(true);
    } else {
      setSelectedCar(car);
      setBookingOpen(true);
    }
  };

  const clearFilters = () => {
    setSelectedBrand('All Brands');
    setSelectedType('All Types');
    setSelectedCity('All Cities');
    setSortBy('default');
    setSearch('');
  };

  const isFiltered =
    selectedBrand !== 'All Brands' ||
    selectedType  !== 'All Types'  ||
    selectedCity  !== 'All Cities' ||
    sortBy        !== 'default'    ||
    search.trim() !== '';

  return (
    <>
      <main className={styles.main} style={{ animation: 'fadeInUp 0.35s ease' }}>

        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.tag}>🇳🇬 Available across Nigeria</div>
          <h1 className={styles.headline}>
            Rent a car,<br /><em>your way.</em>
          </h1>
          <p className={styles.heroSub}>
            Browse owner-listed vehicles and book instantly.
            Car owners earn while they're away.
          </p>
          {!user && (
            <div className={styles.heroCtas}>
              <button
                className={styles.ctaPrimary}
                onClick={() => { setModalIntent('signin'); setModalOpen(true); }}
              >
                Get started free →
              </button>
              <button
                className={styles.ctaGhost}
                onClick={() => { setModalIntent('list'); setModalOpen(true); }}
              >
                List your car
              </button>
            </div>
          )}
        </section>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statNum}>500<span>+</span></div>
            <div className={styles.statDesc}>Cars listed</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>12<span>k+</span></div>
            <div className={styles.statDesc}>Happy renters</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>6</div>
            <div className={styles.statDesc}>Cities covered</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>4.9<span>★</span></div>
            <div className={styles.statDesc}>Average rating</div>
          </div>
        </div>

        {/* Filter Bar */}
        <section className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.dropdowns}>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}>
                {brands.map((b) => <option key={b}>{b}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}>
                <option value="default">Sort by</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="newest">Newest first</option>
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
            {isFiltered && (
              <button className={styles.clearBtn} onClick={clearFilters}>✕ Clear</button>
            )}
          </div>
        </section>

        {/* Results row */}
        <div className={styles.resultsRow}>
          <span className={styles.resultsCount}>
            {loading ? 'Loading...' : `${cars.length} car${cars.length !== 1 ? 's' : ''} found`}
          </span>
          <div className={styles.pills}>
            {['All Types', 'Sedan', 'SUV', 'Luxury', 'Van'].map((t) => (
              <button
                key={t}
                className={`${styles.pill} ${selectedType === t ? styles.pillActive : ''}`}
                onClick={() => setSelectedType(t)}
              >
                {t === 'All Types' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
      {loading && (
  <section className={styles.grid}>
    {[...Array(6)].map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </section>
)}

        {!loading && error && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚠️</div>
            <div className={styles.emptyTitle}>Something went wrong</div>
            <p className={styles.emptySub}>{error}</p>
            <button className={styles.ctaPrimary} onClick={fetchCars}>Try again</button>
          </div>
        )}

        {!loading && !error && cars.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyTitle}>No cars found</div>
            <p className={styles.emptySub}>
              {isFiltered
                ? 'Try adjusting your filters.'
                : 'No cars listed yet. Be the first to list one!'}
            </p>
            {isFiltered && (
              <button className={styles.ctaPrimary} onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && cars.length > 0 && (
          <section className={styles.grid}>
            {cars.map((car) => (
              <CarCard key={car.id} car={car} onBook={handleBook} />
            ))}





          </section>
        )}

      </main>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        intent={modalIntent}
      />

      {bookingOpen && (
        <BookingModal
          car={selectedCar}
          onClose={() => { setBookingOpen(false); setSelectedCar(null); }}
          onSuccess={() => { setBookingOpen(false); setSelectedCar(null); }}
        />
      )}
    </>
  );
}