import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Kuiz
          </div>
          <div className="flex gap-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Amazing Quizzes in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            The modern quiz platform for educators, trainers, and teams. Create
            engaging quizzes with images, multiple choice, and more. Join with a
            simple 6-digit code.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              Create Your First Quiz
            </Link>
            <Link
              href="/join"
              className="px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-xl transition-all"
            >
              Join with Code
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Templates</h3>
              <p className="text-gray-600">
                Create quizzes with images, radio buttons, checkboxes, and more.
                Perfect for flag quizzes, trivia, and assessments.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🔢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Simple 6-Digit Code
              </h3>
              <p className="text-gray-600">
                No accounts needed for participants. Just share a code and
                they&apos;re in. Perfect for classrooms and events.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
              <p className="text-gray-600">
                See scores and responses as they happen. Track progress and
                celebrate achievements together.
              </p>
            </div>
          </div>

          {/* Example Code */}
          <div className="mt-20 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
            <h2 className="text-2xl font-bold mb-4">Try our Demo Quiz!</h2>
            <p className="mb-4">
              World Flags Quiz - Test your geography knowledge
            </p>
            <div className="inline-block bg-white text-gray-800 px-8 py-3 rounded-lg text-2xl font-mono font-bold tracking-wider">
              Join with a code at /join
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2025 Kuiz. Built with Next.js 15, TypeScript, and MongoDB.</p>
      </footer>
    </div>
  );
}
