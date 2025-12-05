import { Input } from '@/components/ui/Input';

interface RealEstateFormProps {
  data: {
    propertyType: string;
    size: string;
    bedrooms: string;
    bathrooms: string;
    yearBuilt: string;
    lotSize: string;
    floors: string;
    parking: string;
    furnished: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function RealEstateForm({ data, onChange }: RealEstateFormProps) {
  return (
    <div className="space-y-4 bg-blue-50 p-6 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Property Specifications</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
          <select
            name="propertyType"
            value={data.propertyType}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
            <option value="office">Office</option>
          </select>
        </div>

        <Input
          label="Size (m²)"
          name="size"
          type="number"
          value={data.size}
          onChange={onChange}
          required
          placeholder="e.g., 140"
          className="text-gray-900"
        />

        <Input
          label="Bedrooms"
          name="bedrooms"
          type="number"
          value={data.bedrooms}
          onChange={onChange}
          placeholder="e.g., 3"
          className="text-gray-900"
        />

        <Input
          label="Bathrooms"
          name="bathrooms"
          type="number"
          value={data.bathrooms}
          onChange={onChange}
          placeholder="e.g., 2"
          className="text-gray-900"
        />

        <Input
          label="Year Built"
          name="yearBuilt"
          type="number"
          value={data.yearBuilt}
          onChange={onChange}
          required
          placeholder="e.g., 2020"
          className="text-gray-900"
        />

        <Input
          label="Lot Size (m²)"
          name="lotSize"
          type="number"
          value={data.lotSize}
          onChange={onChange}
          placeholder="e.g., 185"
          className="text-gray-900"
        />

        <Input
          label="Number of Floors"
          name="floors"
          type="number"
          value={data.floors}
          onChange={onChange}
          placeholder="e.g., 2"
          className="text-gray-900"
        />

        <Input
          label="Parking Spaces"
          name="parking"
          type="number"
          value={data.parking}
          onChange={onChange}
          placeholder="e.g., 1"
          className="text-gray-900"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Furnished</label>
          <select
            name="furnished"
            value={data.furnished}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="no">No</option>
            <option value="partially">Partially</option>
            <option value="fully">Fully Furnished</option>
          </select>
        </div>
      </div>
    </div>
  );
}
