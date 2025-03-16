export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen max-h-screen overflow-hidden">{children}</div>
  );
}
