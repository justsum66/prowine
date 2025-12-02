// 移除重複的 Provider，因為 app/admin/layout.tsx 已經提供了
export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

