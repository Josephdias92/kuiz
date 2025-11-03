import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SessionClient from "./SessionClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SessionPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const quizSession = await prisma.session.findUnique({
    where: { id },
    include: {
      template: {
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      },
      participants: {
        orderBy: { score: "desc" },
      },
      responses: {
        include: {
          participant: true,
          question: true,
        },
      },
    },
  });

  if (!quizSession) {
    notFound();
  }

  if (quizSession.hostId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to view this session.
          </p>
        </div>
      </div>
    );
  }

  // Serialize the session data for client component (dates become strings)
  const serializedSession = JSON.parse(JSON.stringify(quizSession));

  return <SessionClient session={serializedSession} />;
}
