import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { track } from "@/app/lib/analytics";
import { openExternalUrl } from "@/app/lib/telegram";
import policyImage from "@/imports/policy.webp";

const links = {
  terms: "https://well-well-well.online/docs/terms-of-service.pdf",
  privacy: "https://well-well-well.online/docs/privacy-policy.pdf",
  offer: "https://well-well-well.online/docs/offer-users.pdf",
  consent: "https://well-well-well.online/docs/consent-users.pdf",
};

const DocLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="underline decoration-white/80 underline-offset-2"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      openExternalUrl(href);
    }}
  >
    {children}
  </a>
);

export function WelcomeScreen({ onAccept }: { onAccept: () => void | Promise<void> }) {
  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    track("terms_shown", {});
  }, []);

  const handleAccept = async () => {
    if (!checked || accepting) return;
    setAccepting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Terms accept failed", error);
      setAccepting(false);
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#504843]" style={{ height: "100dvh" }}>
      <img
        src={policyImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "linear-gradient(180deg, rgba(80,72,67,0) 0%, rgba(80,72,67,1) 100%)" }}
      />
      <section className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] text-center text-white">
        <h1 className="max-w-[340px] text-[34px] font-semibold leading-[1.08]">
          Среда совместных активностей
        </h1>
        <p className="mt-4 max-w-[350px] text-[16px] font-medium leading-6 text-white/88">
          Найди единомышленников, участвуй в их активностях и создавай из планов привычки
        </p>
        <button
          type="button"
          disabled={!checked || accepting}
          onClick={handleAccept}
          className="mt-8 h-14 w-full rounded-[14px] text-[17px] font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#00887F" }}
        >
          Войти
        </button>
        <div className="mt-4 flex w-full items-start gap-3 text-left">
          <input
            id="termsAccepted"
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#00887F]"
          />
          <p className="text-[12px] leading-4 text-white/88">
            Принимаю условия{" "}
            <DocLink href={links.terms}>Пользовательского соглашения</DocLink>,{" "}
            <DocLink href={links.privacy}>Политики конфиденциальности</DocLink>,{" "}
            <DocLink href={links.offer}>Оферты</DocLink> и даю согласие на{" "}
            <DocLink href={links.consent}>обработку персональных данных</DocLink>
          </p>
        </div>
      </section>
    </main>
  );
}
