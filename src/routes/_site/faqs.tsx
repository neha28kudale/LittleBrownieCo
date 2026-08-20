import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/faqs")({
  beforeLoad: () => {
    throw redirect({ to: "/contact" });
  },
});
