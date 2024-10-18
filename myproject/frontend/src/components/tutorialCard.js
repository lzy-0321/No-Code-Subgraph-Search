import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
{
  Icon: FileTextIcon,
  name: "Save your files",
  description: "We automatically save your files as you type.",
  href: "/",
  cta: "Learn more",
  background: <img className="absolute -right-20 -top-20 opacity-60" />,
  className: "lg:row-start-1 lg:row-end-6 lg:col-start-2 lg:col-end-3", // Adjusted row span
},
{
  Icon: InputIcon,
  name: "Full text search",
  description: "Search through all your files in one place.",
  href: "/",
  cta: "Learn more",
  background: <img className="absolute -right-20 -top-20 opacity-60" />,
  className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-5", // Adjusted row span
},
{
  Icon: GlobeIcon,
  name: "Multilingual",
  description: "Supports 100+ languages and counting.",
  href: "/",
  cta: "Learn more",
  background: <img className="absolute -right-20 -top-20 opacity-60" />,
  className: "lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-6", // Adjusted row span
},
{
  Icon: CalendarIcon,
  name: "Calendar",
  description: "Use the calendar to filter your files by date.",
  href: "/",
  cta: "Learn more",
  background: <img className="absolute -right-20 -top-20 opacity-60" />,
  className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-3", // Adjusted row span
},
{
  Icon: BellIcon,
  name: "Notifications",
  description:
    "Get notified when someone shares a file or mentions you in a comment.",
  href: "/",
  cta: "Learn more",
  background: <img className="absolute -right-20 -top-20 opacity-60" />,
  className: "lg:col-start-3 lg:col-end-3 lg:row-start-3 lg:row-end-6", // Adjusted row span
},
];

export async function tutorialCard() {
return (
  <BentoGrid className="lg:grid-rows-5">
    {features.map((feature) => (
      <BentoCard key={feature.name} {...feature} />
    ))}
  </BentoGrid>
);
}
