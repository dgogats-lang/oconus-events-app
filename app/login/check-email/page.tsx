export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-[#0C2340] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-gray-800 font-semibold mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a sign-in link to your email address. Tap it to sign in.
          </p>
          <p className="text-gray-400 text-xs mt-4">
            The link expires in 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
