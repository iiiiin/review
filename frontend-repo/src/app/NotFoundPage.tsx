export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-5xl font-bold text-blue-600 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">페이지를 찾을 수 없습니다.</p>
      <a
        href="/"
        className="text-blue-600 hover:underline font-semibold"
      >
        메인 페이지로 이동
      </a>
    </div>
  );
}
