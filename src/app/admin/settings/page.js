import { Suspense } from 'react'
import { SettingsDashboard } from '@/components/modules/admin/settings/settings-dashboard'
import { PageContainer, PageHeader, PageBody } from '@/components/layout/admin/page-shell'
import { PageTitle } from '@/components/layout/admin/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Paramètres - Import Export BF',
  description: 'Gérez les paramètres de votre application et de votre compte',
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Paramètres"
        description="Gérez les paramètres de votre application et de votre compte"
      />
      
      <PageHeader
        breadcrumbs={[
          { label: "Accueil", href: "/admin/dashboard" },
          { label: "Paramètres" },
        ]}
      />
      
      <PageBody>
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsDashboard />
        </Suspense>
      </PageBody>
    </PageContainer>
  )
}
