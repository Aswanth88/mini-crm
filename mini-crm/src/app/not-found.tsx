// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h2>
        <p className="text-gray-600 mb-4">Could not find the requested resource</p>
        <a 
          href="/" 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}