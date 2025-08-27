interface ProblemStatementProps {
  title: string;
  description: string;
}

export default function ProblemStatement({ title, description }: ProblemStatementProps) {
  return (
    <div className="flex-shrink-0 bg-gray-700 rounded-lg p-4 text-white">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-300 text-sm">
        {description}
      </p>
    </div>
  );
}
