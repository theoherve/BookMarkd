import { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FeedSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const FeedSection = ({ title, description, children }: FeedSectionProps) => {
  const sectionId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section aria-labelledby={`${sectionId}-title`} className="h-full">
      <Card className="h-full backdrop-blur">
        <CardHeader className="space-y-1.5">
          <CardTitle
            id={`${sectionId}-title`}
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {children}
        </CardContent>
      </Card>
    </section>
  );
};

export default FeedSection;

