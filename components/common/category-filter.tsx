'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCategory } from '@/types';
import { EVENT_CATEGORIES } from '@/utils/constants';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategory: EventCategory | null;
  onCategoryChange: (category: EventCategory | null) => void;
  className?: string;
}

export function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange, 
  className 
}: CategoryFilterProps) {
  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "whitespace-nowrap",
              selectedCategory === null && "bg-gradient-to-r from-orange-500 to-red-500 text-white"
            )}
          >
            All Events
          </Button>
          
          {EVENT_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category.value)}
              className={cn(
                "whitespace-nowrap",
                selectedCategory === category.value && "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              )}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}