import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../App';
import { Service } from '../../types';
import BookingCalendar from './BookingCalendar';

const ServiceCard: React.FC<{ service: Service; onBook: (service: Service) => void }> = ({ service, onBook }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.category}</p>
        </div>
        {service.isFeatured && <div className="text-xs bg-accent text-gray-800 font-bold py-1 px-3 rounded-full">Destaque</div>}
      </div>
      <p className="text-gray-600 dark:text-gray-300 my-4">{service.description}</p>
      <div className="flex justify-between items-center mt-4">
        <p className="text-lg font-semibold text-primary">R$ {service.price.toFixed(2)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{service.duration} min</p>
      </div>
      <button
        onClick={() => onBook(service)}
        className="w-full mt-6 btn-primary text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        Agendar Agora
      </button>
    </div>
  </div>
);

const ServiceCatalog: React.FC = () => {
  const { state } = useAppContext();
  const { services } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const categories = useMemo(() => ['All', ...new Set(services.map(s => s.category))], [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, searchQuery, selectedCategory]);

  if (bookingService) {
    return <BookingCalendar service={bookingService} onBack={() => setBookingService(null)} />;
  }

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Nossos Serviços</h2>
       <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-center border border-gray-200 dark:border-gray-700 rounded-full p-2 space-y-2 sm:space-y-0 sm:space-x-2 bg-white dark:bg-gray-800 shadow-md">
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-grow p-2 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white w-full"
          />
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.map(service => (
          <ServiceCard key={service.id} service={service} onBook={setBookingService} />
        ))}
      </div>
    </div>
  );
};

export default ServiceCatalog;