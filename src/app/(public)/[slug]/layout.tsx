export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </div>
  );
}
