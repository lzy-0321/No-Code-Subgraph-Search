import { TbCrosshair, TbDatabasePlus, TbFilterPlus, TbInputSearch, TbTrash, TbSettingsSearch } from "react-icons/tb";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: TbCrosshair,
    name: "Add node or relationship in match",
    description: "Add a node or relationship to your match query.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:row-start-1 lg:row-end-5 lg:col-start-2 lg:col-end-3", // 调整行高
  },
  {
    Icon: TbDatabasePlus,
    name: "Link databases",
    description: "Link your Neo4j databases to your account.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-4", // 调整行高
  },
  {
    Icon: TbInputSearch,
    name: "Search globally",
    description: "Search through all your node and relationship data.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-4 lg:row-end-5", // 调整行高
  },
  {
    Icon: TbFilterPlus,
    name: "Filter by date",
    description: "Filter your graph data by date.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-3", // 调整行高
  },
  {
    Icon: TbSettingsSearch,
    name: "Query configuration",
    description: "Adjust each query",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-3 lg:row-end-4", // 调整行高
  },
  {
    Icon: TbTrash,
    name: "Clean Up",
    description: "Clean up your graph by removing unused nodes and relationships.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -right-20 -top-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-4 lg:row-end-5", // 调整行高
  },
];

export async function tutorialCard() {
  return (
    <BentoGrid className="lg:grid-rows-3"> {/* 减少总行数 */}
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}
