import { PricingTable } from "@/components/modules/admin/pricing/pricing-table";
import { PageContainer, PageHeader, PageBody } from "@/components/layout/admin/page-shell";
import { PageTitle } from "@/components/layout/admin/page-title";

export const metadata = {
  title: "Tarifs - Naange Envoi",
  description: "Les prix de la caisse, du formulaire de colis et du site public",
};

export default function PricingPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Tarifs"
        description="Les prix de la caisse, du formulaire de colis et du site public"
      />
      <PageHeader breadcrumbs={[{ label: "Hub", href: "/admin" }, { label: "Tarifs" }]} />
      <PageBody>
        <PricingTable />
      </PageBody>
    </PageContainer>
  );
}
