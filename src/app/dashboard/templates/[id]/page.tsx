import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import TemplateEditor from "./TemplateEditor";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TemplateDetailPage({ params }: Params) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <TemplateEditor
          templateId={id}
          userId={session.user.id}
          isAdmin={session.user.isAdmin}
        />
      </div>
    </div>
  );
}
