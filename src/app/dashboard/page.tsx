import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch user's templates
  const myTemplates = await prisma.template.findMany({
    where: {
      creatorId: session.user.id,
    },
    include: {
      _count: {
        select: {
          questions: true,
          sessions: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Fetch public templates (created by others)
  const publicTemplates = await prisma.template.findMany({
    where: {
      isPublic: true,
      creatorId: {
        not: session.user.id,
      },
    },
    include: {
      _count: {
        select: {
          questions: true,
          sessions: true,
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Fetch recent sessions
  const sessions = await prisma.session.findMany({
    where: {
      hostId: session.user.id,
    },
    include: {
      template: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Kuiz
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your quizzes and sessions</p>
        </div>

        <DashboardClient
          initialTemplates={JSON.parse(JSON.stringify(myTemplates))}
          initialPublicTemplates={JSON.parse(JSON.stringify(publicTemplates))}
          initialSessions={JSON.parse(JSON.stringify(sessions))}
        />
      </main>
    </div>
  );
}
