import { TbCrosshair, TbDatabasePlus, TbFilterPlus, TbInputSearch, TbTrash } from "react-icons/tb";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: TbCrosshair,
    name: "Add node or relationship in match",
    description: "Add a node or relationship to your match query.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:row-start-1 lg:row-end-6 lg:col-start-2 lg:col-end-3", // Adjusted row span
  },
  {
    Icon: TbDatabasePlus,
    name: "Link databases",
    description: "Link your Neo4j databases to your account.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-5", // Adjusted row span
  },
  {
    Icon: TbInputSearch,
    name: "Search globally",
    description: "Search through all your node and relationship data.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-5 lg:row-end-6", // Adjusted row span
  },
  {
    Icon: TbFilterPlus,
    name: "Filter by date",
    description: "Filter your graph data by date.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-3", // Adjusted row span
  },
  {
    Icon: TbTrash,
    name: "Clean Up",
    description: "Clean up your graph by removing unused nodes and relationships.",
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
