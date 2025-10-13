import { Suspense } from 'react'
import { ProfileDashboard } from '@/components/modules/admin/profile/profile-dashboard'
import { PageShell } from '@/components/layout/admin/page-shell'
import { PageTitle } from '@/components/layout/admin/page-title'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Profil - Import Export BF',
  description: 'Gérez votre profil utilisateur et vos paramètres de sécurité',
}

function ProfileSkeleton() {
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

export default function ProfilePage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <PageTitle
          title="Mon Profil"
          description="Gérez vos informations personnelles et paramètres de sécurité"
        />
        
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileDashboard />
        </Suspense>
      </div>
    </PageShell>
  )
}
