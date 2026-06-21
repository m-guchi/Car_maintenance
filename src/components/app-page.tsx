import type { ReactNode } from "react";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

export function AppPage({ children, className = "" }: AppPageProps) {
  return (
    <div
      className={`mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6 lg:max-w-5xl lg:pb-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
