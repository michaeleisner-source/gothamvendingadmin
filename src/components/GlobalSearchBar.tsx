import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NAV } from "@/config/nav";

// Generate searchable pages from navigation config with enhanced metadata
const allPages = NAV.flatMap(section => 
  section.items.map(item => {
    // Generate aliases from label and path
    const labelWords = item.label.toLowerCase().split(/\s+/);
    const pathWords = item.path.split('/').filter(Boolean);
    const aliases = [
      ...labelWords,
      ...pathWords,
      item.label.toLowerCase(),
      section.title.toLowerCase(),
    ];
    
    return {
      title: item.label,
      url: item.path,
      category: section.title,
      aliases: [...new Set(aliases)] // Remove duplicates
    };
  })
);

export function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredPages = useMemo(() => {
    if (!search) return [];
    
    const searchLower = search.toLowerCase().trim();
    
    return allPages.filter(page => {
      // Check title, category, aliases, and URL
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.category.toLowerCase().includes(searchLower) ||
        page.aliases?.some(alias => alias.includes(searchLower)) ||
        page.url.toLowerCase().includes(searchLower)
      );
    }).slice(0, 10); // Limit to 10 results
  }, [search]);

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
    setSearch("");
  };

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof allPages> = {};
    filteredPages.forEach(page => {
      if (!groups[page.category]) {
        groups[page.category] = [];
      }
      groups[page.category].push(page);
    });
    return groups;
  }, [filteredPages]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-64 justify-start text-muted-foreground hover:text-foreground hover:bg-accent border-input"
        >
          <Search className="h-4 w-4 mr-2" />
          Search everything...
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-popover border shadow-lg z-50" 
        align="start"
      >
        <Command className="bg-popover">
          <CommandInput 
            placeholder="Search pages..." 
            value={search}
            onValueChange={setSearch}
            className="border-0 bg-transparent"
          />
          <CommandList className="bg-popover">
            {search && filteredPages.length === 0 && (
              <CommandEmpty className="text-muted-foreground py-6 text-center text-sm">
                No results found
              </CommandEmpty>
            )}
            {Object.entries(groupedResults).map(([category, pages]) => (
              <CommandGroup key={category} heading={category} className="text-muted-foreground">
                {pages.map((page) => (
                  <CommandItem
                    key={page.url}
                    value={page.title}
                    onSelect={() => handleSelect(page.url)}
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}