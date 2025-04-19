export default function ErrorPage() {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-md">
          <h2 className="text-center text-2xl font-bold text-red-600">Error</h2>
          <p className="text-center">
            There was an error processing your request. Please try again or contact support.
          </p>
          <div className="flex justify-center">
            <a
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Return to Login
            </a>
          </div>
        </div>
      </div>
    )
  }