import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../App';
import { Service } from '../../types';
import BookingCalendar from './BookingCalendar';

const ServiceCard: React.FC<{ service: Service; onBook: (service: Service) => void }> = ({ service, onBook }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.category}</p>
        </div>
        {service.isFeatured && <div className="text-xs bg-accent text-white font-bold py-1 px-2 rounded-full">Destaque</div>}
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
       <div className="mb-6">
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg p-1 space-x-1 bg-white dark:bg-gray-800">
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-grow p-2 bg-transparent border-none focus:ring-0 dark:text-white"
          />
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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