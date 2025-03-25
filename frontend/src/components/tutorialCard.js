import { TbCrosshair, TbDatabasePlus, TbFilterPlus, TbInputSearch, TbTrash, TbSettingsSearch } from "react-icons/tb";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    Icon: TbCrosshair,
    name: "Add node or relationship in match",
    description: "Add a node or relationship to your match query.",
    href: "/docs/add-node-relationship",
    cta: "Learn more",
    background: null,
    className: "lg:row-start-1 lg:row-end-5 lg:col-start-2 lg:col-end-3", // 调整行高
  },
  {
    Icon: TbDatabasePlus,
    name: "Link databases",
    description: "Link your Neo4j databases to your account.",
    href: "/docs/database-connection",
    cta: "Learn more",
    background: null,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-4", // 调整行高
  },
  {
    Icon: TbInputSearch,
    name: "Search globally",
    description: "Search through all your node and relationship data.",
    href: "/docs/global-search",
    cta: "Learn more",
    background: null,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-4 lg:row-end-5", // 调整行高
  },
  {
    Icon: TbFilterPlus,
    name: "Filter by date",
    description: "Filter your graph data by date.",
    href: "/docs/data-filter",
    cta: "Learn more",
    background: null,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-3", // 调整行高
  },
  {
    Icon: TbSettingsSearch,
    name: "Query configuration",
    description: "Adjust each query",
    href: "/docs/query-configuration",
    cta: "Learn more",
    background: null,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-3 lg:row-end-4", // 调整行高
  },
  {
    Icon: TbTrash,
    name: "Clean Up",
    description: "Clean up your graph by removing unused nodes and relationships.",
    href: "/docs/clean-up",
    cta: "Learn more",
    background: null,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-4 lg:row-end-5", // 调整行高
  },
];

export function TutorialCard() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <BentoGrid className="lg:grid-rows-3">
        {features.map((feature) => (
          <BentoCard 
            key={feature.name} 
            {...feature}
          />
        ))}
      </BentoGrid>
    </div>
  );
}
