import React, { useState } from 'react';
import { useAppContext } from '../../App';
import { Service } from '../../types';

const ServiceForm: React.FC<{ service?: Service; onSave: (service: Service) => void; onCancel: () => void }> = ({ service, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Service, 'id'>>({
        name: service?.name || '',
        description: service?.description || '',
        price: service?.price || 0,
        duration: service?.duration || 30,
        category: service?.category || '',
        isFeatured: service?.isFeatured || false,
    });

    // FIX: Destructuring properties from e.target can prevent TypeScript's type narrowing from working correctly.
    // By using a variable for e.target and accessing its properties directly, we ensure type guards are effective.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            setFormData(prev => ({ ...prev, [target.name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [target.name]: target.type === 'number' ? parseFloat(target.value) : target.value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newService = {
            id: service?.id || new Date().toISOString(),
            ...formData,
        };
        onSave(newService);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Serviço" className="w-full p-2 border rounded bg-white text-gray-900" required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded bg-white text-gray-900" required />
            <input name="price" value={formData.price} type="number" onChange={handleChange} placeholder="Preço" className="w-full p-2 border rounded bg-white text-gray-900" required />
            <input name="duration" value={formData.duration} type="number" step="5" onChange={handleChange} placeholder="Duração (minutos)" className="w-full p-2 border rounded bg-white text-gray-900" required />
            <input name="category" value={formData.category} onChange={handleChange} placeholder="Categoria" className="w-full p-2 border rounded bg-white text-gray-900" required />
            <label className="flex items-center space-x-2">
                <input name="isFeatured" type="checkbox" checked={formData.isFeatured} onChange={handleChange} />
                <span>Destaque</span>
            </label>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 btn-primary text-white rounded">Salvar</button>
            </div>
        </form>
    );
};

const ServiceManager: React.FC = () => {
    const { state, setState } = useAppContext();
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (service: Service) => {
        setState(prev => {
            const exists = prev.services.some(s => s.id === service.id);
            const services = exists
                ? prev.services.map(s => s.id === service.id ? service : s)
                : [...prev.services, service];
            return { ...prev, services };
        });
        setEditingService(null);
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            setState(prev => ({
                ...prev,
                services: prev.services.filter(s => s.id !== id),
            }));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Serviços</h2>
                <button onClick={() => setIsCreating(true)} className="btn-primary text-white font-bold py-2 px-4 rounded">Novo Serviço</button>
            </div>

            {(isCreating || editingService) && (
                <div className="mb-6">
                    <ServiceForm
                        service={editingService || undefined}
                        onSave={handleSave}
                        onCancel={() => { setEditingService(null); setIsCreating(false); }}
                    />
                </div>
            )}
            
            <div className="space-y-4">
                {state.services.map(service => (
                    <div key={service.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                        <div>
                            <p className="font-bold">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.category} - R${service.price.toFixed(2)}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setEditingService(service)} className="px-3 py-1 bg-yellow-400 text-white text-sm rounded">Editar</button>
                            <button onClick={() => handleDelete(service.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">Excluir</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceManager;