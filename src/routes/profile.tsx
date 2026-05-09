import { createFileRoute } from "@tanstack/react-router";
import { ProfileTab } from "@/components/tabs/ProfileTab";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/profile")({
  head: () =>
    pageHead({
      path: "/profile",
      title: "Your Profile — BizzSurfer Go!",
      description:
        "Track your XP, streaks, and badges as you explore Agentic AI for business transformation.",
      breadcrumbName: "Profile",
    }),
  component: ProfileTab,
});
