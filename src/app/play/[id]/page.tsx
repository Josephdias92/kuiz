import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import PlayClient from "./PlayClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlayPage({ params }: Props) {
  const { id } = await params;

  // Get participant info from query or storage (would be better with cookies)
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      template: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              type: true,
              text: true,
              imageUrl: true,
              options: true,
              order: true,
              points: true,
              timeLimit: true,
            },
          },
        },
      },
      participants: {
        orderBy: { score: "desc" },
      },
      responses: {
        select: {
          id: true,
          questionId: true,
          participantId: true,
          answer: true,
          isCorrect: true,
          points: true,
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    redirect(`/session/${id}/results`);
  }

  return <PlayClient session={JSON.parse(JSON.stringify(session))} />;
}
