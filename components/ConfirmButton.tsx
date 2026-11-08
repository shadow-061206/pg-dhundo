"use client";

// A submit button that asks "Are you sure?" first. Use inside a <form action={serverAction}>.
export default function ConfirmButton({ message, children, className = "" }: { message: string; children: React.ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
