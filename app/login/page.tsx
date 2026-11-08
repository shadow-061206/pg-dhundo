import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
