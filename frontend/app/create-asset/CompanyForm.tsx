import { Input } from '@/components/ui/Input';

interface CompanyFormProps {
  data: {
    companyName: string;
    industry: string;
    yearEstablished: string;
    revenue: string;
    employees: string;
    valuation: string;
    equity: string;
    registrationNumber: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function CompanyForm({ data, onChange }: CompanyFormProps) {
  return (
    <div className="space-y-4 bg-purple-50 p-6 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Company Name"
          name="companyName"
          type="text"
          value={data.companyName}
          onChange={onChange}
          required
          placeholder="e.g., ABC Tech Inc."
          className="text-gray-900"
        />

        <Input
          label="Industry"
          name="industry"
          type="text"
          value={data.industry}
          onChange={onChange}
          required
          placeholder="e.g., Technology, Manufacturing"
          className="text-gray-900"
        />

        <Input
          label="Year Established"
          name="yearEstablished"
          type="number"
          value={data.yearEstablished}
          onChange={onChange}
          required
          placeholder="e.g., 2015"
          className="text-gray-900"
        />

        <Input
          label="Annual Revenue (USD)"
          name="revenue"
          type="number"
          value={data.revenue}
          onChange={onChange}
          required
          placeholder="e.g., 5000000"
          className="text-gray-900"
        />

        <Input
          label="Number of Employees"
          name="employees"
          type="number"
          value={data.employees}
          onChange={onChange}
          required
          placeholder="e.g., 50"
          className="text-gray-900"
        />

        <Input
          label="Company Valuation (USD)"
          name="valuation"
          type="number"
          value={data.valuation}
          onChange={onChange}
          required
          placeholder="e.g., 10000000"
          className="text-gray-900"
        />

        <Input
          label="Equity Offered (%)"
          name="equity"
          type="number"
          step="0.1"
          value={data.equity}
          onChange={onChange}
          required
          placeholder="e.g., 10"
          className="text-gray-900"
        />

        <Input
          label="Registration Number"
          name="registrationNumber"
          type="text"
          value={data.registrationNumber}
          onChange={onChange}
          required
          placeholder="Business registration ID"
          className="text-gray-900"
        />
      </div>
    </div>
  );
}
