import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — FeverGate",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">အင်တာနက် မရှိပါ</h1>
      <p className="mt-2 text-slate-500">
        သင်သည် အော့ဖ်လိုင်း ဖြစ်နေသည်။ ဖျားနာမှု စစ်ဆေးခြင်း ဆက်လက် အသုံးပြုနိုင်ပါသည်။
        AI အကူအညီ အတွက်သာ အင်တာနက် လိုအပ်ပါသည်။
      </p>
      <p className="mt-1 text-sm text-slate-400">
        You are offline. Triage still works; only the AI assistant needs a connection.
      </p>
    </div>
  );
}
