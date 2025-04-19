// components/footer.tsx
export function Footer() {
    return (
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Whiteboard. All rights reserved.
        </div>
      </footer>
    )
  }