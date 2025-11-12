import React, { useState } from 'react';
import { useAppContext } from '../../App';
import { Promotion, Service } from '../../types';

const PromotionForm: React.FC<{ promotion?: Promotion; services: Service[]; onSave: (promotion: Promotion) => void; onCancel: () => void }> = ({ promotion, services, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Promotion, 'id' | 'uses'>>({
        title: promotion?.title || '',
        description: promotion?.description || '',
        promoCode: promotion?.promoCode || '',
        type: promotion?.type || 'percentage',
        value: promotion?.value || 0,
        serviceIds: promotion?.serviceIds || [],
        startDate: promotion?.startDate ? promotion.startDate.split('T')[0] : '',
        endDate: promotion?.endDate ? promotion.endDate.split('T')[0] : '',
        usageLimit: promotion?.usageLimit || undefined,
        isActive: promotion?.isActive ?? true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value }));
        }
    };
    
    const handleServiceChange = (serviceId: string) => {
        setFormData(prev => {
            const newServiceIds = prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId];
            return { ...prev, serviceIds: newServiceIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newPromotion: Promotion = {
            id: promotion?.id || new Date().toISOString(),
            uses: promotion?.uses || 0,
            ...formData,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
        };
        onSave(newPromotion);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">{promotion ? 'Editar' : 'Criar'} Promoção</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Título da Promoção" className="w-full p-2 border rounded" required />
                <input name="promoCode" value={formData.promoCode} onChange={handleChange} placeholder="Código Promocional (opcional)" className="w-full p-2 border rounded" />
            </div>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded" required />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                </select>
                <input name="value" value={formData.value} type="number" step="0.01" onChange={handleChange} placeholder="Valor do Desconto" className="w-full p-2 border rounded" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="startDate" value={formData.startDate} type="date" onChange={handleChange} className="w-full p-2 border rounded" required />
                <input name="endDate" value={formData.endDate} type="date" onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
            <input name="usageLimit" value={formData.usageLimit || ''} type="number" onChange={handleChange} placeholder="Limite de Usos (opcional)" className="w-full p-2 border rounded" />

            <div>
                <h4 className="font-semibold">Serviços Aplicáveis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded">
                    {services.map(service => (
                        <label key={service.id} className="flex items-center space-x-2">
                            <input type="checkbox" checked={formData.serviceIds.includes(service.id)} onChange={() => handleServiceChange(service.id)} />
                            <span>{service.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <label className="flex items-center space-x-2">
                <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
                <span>Ativa</span>
            </label>

            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 btn-primary text-white rounded">Salvar</button>
            </div>
        </form>
    );
};

const PromotionManager: React.FC = () => {
    const { state, setState } = useAppContext();
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleSave = (promotion: Promotion) => {
        setState(prev => {
            const exists = prev.promotions.some(p => p.id === promotion.id);
            const promotions = exists
                ? prev.promotions.map(p => p.id === promotion.id ? promotion : p)
                : [...prev.promotions, promotion];
            return { ...prev, promotions };
        });
        setEditingPromotion(null);
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
            setState(prev => ({
                ...prev,
                promotions: prev.promotions.filter(p => p.id !== id),
            }));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Promoções</h2>
                <button onClick={() => setIsCreating(true)} className="btn-primary text-white font-bold py-2 px-4 rounded">Nova Promoção</button>
            </div>

            {(isCreating || editingPromotion) && (
                <div className="mb-6">
                    <PromotionForm
                        promotion={editingPromotion || undefined}
                        services={state.services}
                        onSave={handleSave}
                        onCancel={() => { setEditingPromotion(null); setIsCreating(false); }}
                    />
                </div>
            )}
            
            <div className="space-y-4">
                {state.promotions.map(promo => (
                    <div key={promo.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                        <div>
                            <p className="font-bold">{promo.title} {promo.isActive ? <span className="text-xs text-green-500">(Ativa)</span> : <span className="text-xs text-red-500">(Inativa)</span>}</p>
                            <p className="text-sm text-gray-500">{promo.promoCode ? `Código: ${promo.promoCode}` : 'Sem código'}</p>
                            <p className="text-sm text-gray-500">Usos: {promo.uses}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => setEditingPromotion(promo)} className="px-3 py-1 bg-yellow-400 text-white text-sm rounded">Editar</button>
                            <button onClick={() => handleDelete(promo.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded">Excluir</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PromotionManager;