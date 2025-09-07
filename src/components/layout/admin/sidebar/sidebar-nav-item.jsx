"use client";

import React, { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLayout } from '../layout-provider';

// ===== SIDEBAR NAVIGATION ITEM =====
export const SidebarNavItem = ({ item, isActive = false, onClick, searchQuery = "" }) => {
  const { sidebarOpen, expandedSections, toggleSection } = useLayout();
  const router = useRouter();
  const pathname = usePathname();
  
  const IconComponent = item.icon;
  const hasChildren = item.items && item.items.length > 0;
  const isExpanded = expandedSections.has(item.title);
  
  // Ouvrir automatiquement les sections qui contiennent des résultats de recherche
  const hasMatchingChildren = useMemo(() => {
    if (!searchQuery || !hasChildren) return false;
    const normalizedQuery = searchQuery.toLowerCase();
    return item.items.some(subItem => 
      subItem.title.toLowerCase().includes(normalizedQuery) ||
      (subItem.description && subItem.description.toLowerCase().includes(normalizedQuery))
    );
  }, [searchQuery, hasChildren, item.items]);

  const shouldShowExpanded = isExpanded || (searchQuery && hasMatchingChildren);

  const handleClick = () => {
    if (hasChildren) {
      toggleSection(item.title);
    } else if (item.url) {
      router.push(item.url);
      onClick?.();
    }
  };

  const handleSubItemClick = (url) => {
    router.push(url);
    onClick?.();
  };

  // Fonction pour surligner le texte de recherche
  const highlightText = (text, query) => {
    if (!query) return text;
    const normalizedQuery = query.toLowerCase();
    const normalizedText = text.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
          {text.substring(index, index + query.length)}
        </mark>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div className="mb-1">
      {!sidebarOpen ? (
        // Version collapsée avec dropdown pour les sous-éléments
        hasChildren ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-center h-9 px-2 font-medium transition-all duration-200 relative",
                  "cursor-pointer hover:cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
                style={{ cursor: 'pointer' }}
              >
                {/* Indicateur visuel pour le bouton actif */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                )}
                <IconComponent 
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-black"
                  )}
                  style={{ strokeWidth: 3 }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" sideOffset={10} className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" style={{ strokeWidth: 3 }} />
                {item.title}
              </DropdownMenuLabel>
              {item.description && (
                <div className="px-2 pb-2">
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              )}
              <DropdownMenuSeparator />
              {item.items.map((subItem) => {
                const SubItemIcon = subItem.icon;
                const isSubActive = pathname === subItem.url;
                return (
                  <DropdownMenuItem
                    key={subItem.title}
                    onClick={() => handleSubItemClick(subItem.url)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSubActive && "bg-primary text-primary-foreground font-medium"
                    )}
                  >
                    <SubItemIcon 
                      className="mr-2 h-5 w-5" 
                      style={{ strokeWidth: 2 }}
                    />
                    <span>{subItem.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Version simple avec tooltip pour les éléments sans enfants
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleClick}
                  className={cn(
                    "w-full justify-center h-9 px-2 font-medium transition-all duration-200 relative",
                    "cursor-pointer hover:cursor-pointer",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Indicateur visuel pour le bouton actif */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                  )}
                  <IconComponent 
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isActive ? "text-primary-foreground" : "text-black"
                    )}
                    style={{ strokeWidth: 3 }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <div className="flex flex-col max-w-xs">
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      ) : (
        // Version étendue normale
        <Button
          variant="ghost"
          onClick={handleClick}
          className={cn(
            "w-full justify-start h-9 px-2 font-medium transition-all duration-200 relative",
            "cursor-pointer hover:cursor-pointer",
            isActive 
              ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
          style={{ cursor: 'pointer' }}
        >
          {/* Indicateur visuel pour le bouton actif */}
          {isActive && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
          )}
          <IconComponent 
            className={cn(
              "h-5 w-5 shrink-0 transition-colors ml-1",
              isActive ? "text-primary-foreground" : "text-black"
            )}
            style={{ strokeWidth: 3 }}
          />
          <span className={cn(
            "ml-2 text-sm transition-colors",
            isActive ? "text-primary-foreground font-semibold" : ""
          )}>
            {highlightText(item.title, searchQuery)}
          </span>
          {hasChildren && (
            <ChevronRight 
              className={cn(
                "ml-auto h-5 w-5 transition-all duration-200",
                shouldShowExpanded && "rotate-90",
                isActive ? "text-primary-foreground" : "text-black"
              )}
              style={{ strokeWidth: 3 }}
            />
          )}
        </Button>
      )}
      
      {hasChildren && sidebarOpen && shouldShowExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-primary/20 pl-4">
          {item.items.map((subItem) => {
            const SubIcon = subItem.icon;
            const isSubActive = pathname === subItem.url;
            
            return (
              <Link key={subItem.title} href={subItem.url}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-8 px-2 font-medium text-sm transition-all duration-200 relative",
                    "cursor-pointer hover:cursor-pointer",
                    isSubActive 
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Petit indicateur pour les sous-éléments actifs */}
                  {isSubActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-primary-foreground rounded-r-full" />
                  )}
                  <SubIcon 
                    className={cn(
                      "h-5 w-5 mr-2 transition-colors",
                      isSubActive ? "text-primary-foreground" : "text-black"
                    )}
                    style={{ strokeWidth: 2 }}
                  />
                  <span className={cn(
                    "transition-colors",
                    isSubActive ? "font-semibold" : ""
                  )}>
                    {highlightText(subItem.title, searchQuery)}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};