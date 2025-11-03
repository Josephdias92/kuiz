import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import TemplateBuilder from "./TemplateBuilder";

export default async function NewTemplatePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <TemplateBuilder userId={session.user.id} />
      </div>
    </div>
  );
}
