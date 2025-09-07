'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LogOut, Loader2 } from 'lucide-react'

export default function LogoutButton({
  variant = 'ghost',
  size = 'sm',
  showIcon = true,
  showText = true,
  confirmLogout = true,
  className = '',
  onLogoutStart,
  onLogoutComplete
}) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleLogout = async () => {
    setIsLoading(true)
    onLogoutStart?.()
    
    try {
      await signOut({
        callbackUrl: '/login',
        redirect: true
      })
      onLogoutComplete?.()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      setIsLoading(false)
    }
  }

  // Version sans confirmation
  if (!confirmLogout) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading}
        onClick={handleLogout}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {showIcon && <LogOut className="w-4 h-4" />}
            {showText && (
              <span className={showIcon ? 'ml-2' : ''}>
                {isLoading ? 'Déconnexion...' : 'Déconnexion'}
              </span>
            )}
          </>
        )}
      </Button>
    )
  }

  // Version avec confirmation
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          {showIcon && <LogOut className="w-4 h-4" />}
          {showText && (
            <span className={showIcon ? 'ml-2' : ''}>
              Déconnexion
            </span>
          )}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter
            pour accéder à nouveau à votre compte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Déconnexion...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}