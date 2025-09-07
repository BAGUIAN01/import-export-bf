import React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/ui/custom-breadcums";

export function PageContainer({ children, className }) {
  return <div className={cn("p-6 space-y-4", className)}>{children}</div>;
}

export function PageHeader({
  // title retiré
  subtitle,
  breadcrumbs = [],
  actions = null,
  className,
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs?.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-1" />}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator />
    </div>
  );
}

export function PageBody({ children, className }) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

export function PageSection({ title, description, right = null, children, className }) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
            </div>
            {right}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
