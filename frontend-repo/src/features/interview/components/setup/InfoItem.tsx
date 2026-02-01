
const InfoItem = ({ label, value }: { label: string, value: string | null }) => (
  <div className="flex justify-between py-3 border-b border-gray-200 last:border-b-0">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-800 font-medium text-right truncate">{value || '선택 안함'}</dd>
  </div>
);

export default InfoItem;
