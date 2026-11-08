export default function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-extrabold text-deep">Contact us</h1>
      <p className="mt-3 text-slate-600">
        Questions about a listing, a booking or a payment? Email us and include your booking details.
      </p>
      <p className="mt-4">
        <a className="font-semibold text-brand hover:underline" href="mailto:support@example.com">support@example.com</a>
      </p>
      <p className="mt-6 text-sm text-slate-500">Replace this address (and add your phone number) before you go live.</p>
    </div>
  );
}
