import { auth } from "@/auth";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("認証が必要です");
  }

  return userId;
}
