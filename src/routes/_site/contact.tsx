import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/contact")({
  beforeLoad: () => {
    throw redirect({ to: "/faqs" });
  },
});
