import { prisma } from "@/lib/prisma";

export async function hasRegisteredPasskeys(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      _count: { select: { authenticators: true } },
    },
  });

  return (user?._count.authenticators ?? 0) > 0;
}

export async function deletePasskeysForUser(userId: string): Promise<void> {
  await prisma.authenticator.deleteMany({
    where: { userId },
  });
}
