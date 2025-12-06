import { Input } from '@/components/ui/Input';

interface CommodityFormProps {
  data: {
    commodityType: string;
    weight: string;
    unit: string;
    purity: string;
    certification: string;
    storage: string;
    form: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function CommodityForm({ data, onChange }: CommodityFormProps) {
  return (
    <div className="space-y-4 bg-yellow-50 p-6 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Commodity Specifications</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Commodity Type</label>
          <select
            name="commodityType"
            value={data.commodityType}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="platinum">Platinum</option>
            <option value="palladium">Palladium</option>
            <option value="diamond">Diamond</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Input
          label="Weight"
          name="weight"
          type="number"
          step="0.01"
          value={data.weight}
          onChange={onChange}
          required
          placeholder="e.g., 100"
          className="text-gray-900"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
          <select
            name="unit"
            value={data.unit}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="grams">Grams</option>
            <option value="kilograms">Kilograms</option>
            <option value="ounces">Troy Ounces</option>
            <option value="carats">Carats</option>
          </select>
        </div>

        <Input
          label="Purity (%)"
          name="purity"
          type="number"
          step="0.01"
          value={data.purity}
          onChange={onChange}
          required
          placeholder="e.g., 99.99"
          className="text-gray-900"
        />

        <Input
          label="Certification"
          name="certification"
          type="text"
          value={data.certification}
          onChange={onChange}
          placeholder="e.g., LBMA, GIA"
          className="text-gray-900"
        />

        <Input
          label="Storage Location"
          name="storage"
          type="text"
          value={data.storage}
          onChange={onChange}
          required
          placeholder="e.g., Swiss Bank Vault"
          className="text-gray-900"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Form</label>
          <select
            name="form"
            value={data.form}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="bars">Bars</option>
            <option value="coins">Coins</option>
            <option value="jewelry">Jewelry</option>
            <option value="stones">Stones</option>
            <option value="bullion">Bullion</option>
          </select>
        </div>
      </div>
    </div>
  );
}
