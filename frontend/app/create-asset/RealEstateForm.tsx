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
    <div className="space-y-4 bg-primary-muted border border-primary/30 p-6 rounded-xl">
      <h3 className="font-semibold text-foreground mb-4">Property Specifications</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground-muted mb-2">Property Type</label>
          <select
            name="propertyType"
            value={data.propertyType}
            onChange={onChange}
            className="w-full px-4 py-3 border border-border bg-surface text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
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
        />

        <Input
          label="Bedrooms"
          name="bedrooms"
          type="number"
          value={data.bedrooms}
          onChange={onChange}
          placeholder="e.g., 3"
        />

        <Input
          label="Bathrooms"
          name="bathrooms"
          type="number"
          value={data.bathrooms}
          onChange={onChange}
          placeholder="e.g., 2"
        />

        <Input
          label="Year Built"
          name="yearBuilt"
          type="number"
          value={data.yearBuilt}
          onChange={onChange}
          required
          placeholder="e.g., 2020"
        />

        <Input
          label="Lot Size (m²)"
          name="lotSize"
          type="number"
          value={data.lotSize}
          onChange={onChange}
          placeholder="e.g., 185"
        />

        <Input
          label="Number of Floors"
          name="floors"
          type="number"
          value={data.floors}
          onChange={onChange}
          placeholder="e.g., 2"
        />

        <Input
          label="Parking Spaces"
          name="parking"
          type="number"
          value={data.parking}
          onChange={onChange}
          placeholder="e.g., 1"
        />

        <div>
          <label className="block text-sm font-medium text-foreground-muted mb-2">Furnished</label>
          <select
            name="furnished"
            value={data.furnished}
            onChange={onChange}
            className="w-full px-4 py-3 border border-border bg-surface text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
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
