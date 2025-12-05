import { Input } from '@/components/ui/Input';

interface VehicleFormProps {
  data: {
    make: string;
    model: string;
    year: string;
    mileage: string;
    transmission: string;
    fuelType: string;
    engineSize: string;
    color: string;
    vin: string;
    owners: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function VehicleForm({ data, onChange }: VehicleFormProps) {
  return (
    <div className="space-y-4 bg-green-50 p-6 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Vehicle Specifications</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Make"
          name="make"
          type="text"
          value={data.make}
          onChange={onChange}
          required
          placeholder="e.g., Toyota"
          className="text-gray-900"
        />

        <Input
          label="Model"
          name="model"
          type="text"
          value={data.model}
          onChange={onChange}
          required
          placeholder="e.g., Camry"
          className="text-gray-900"
        />

        <Input
          label="Year"
          name="year"
          type="number"
          value={data.year}
          onChange={onChange}
          required
          placeholder="e.g., 2022"
          className="text-gray-900"
        />

        <Input
          label="Mileage (km)"
          name="mileage"
          type="number"
          value={data.mileage}
          onChange={onChange}
          required
          placeholder="e.g., 50000"
          className="text-gray-900"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
          <select
            name="transmission"
            value={data.transmission}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
            <option value="cvt">CVT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
          <select
            name="fuelType"
            value={data.fuelType}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <Input
          label="Engine Size (L)"
          name="engineSize"
          type="text"
          value={data.engineSize}
          onChange={onChange}
          placeholder="e.g., 2.5"
          className="text-gray-900"
        />

        <Input
          label="Color"
          name="color"
          type="text"
          value={data.color}
          onChange={onChange}
          placeholder="e.g., Silver"
          className="text-gray-900"
        />

        <Input
          label="VIN Number"
          name="vin"
          type="text"
          value={data.vin}
          onChange={onChange}
          required
          placeholder="17-character VIN"
          className="text-gray-900"
        />

        <Input
          label="Previous Owners"
          name="owners"
          type="number"
          value={data.owners}
          onChange={onChange}
          required
          placeholder="e.g., 1"
          className="text-gray-900"
        />
      </div>
    </div>
  );
}
