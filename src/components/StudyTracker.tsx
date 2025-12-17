import { useEffect, useState, useMemo } from 'react';
import { parseStudyPlan, type Section } from '@/lib/parser';
// @ts-ignore
import todoContent from '@/todo.md?raw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function StudyTracker() {
  const [sections, setSections] = useState<Section[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    const parsed = parseStudyPlan(todoContent);
    setSections(parsed);
    if (parsed.length > 0) {
      setActiveTab(parsed[0].title);
    }
    
    const saved = localStorage.getItem('completedTasks');
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
    
    // Enforce dark mode
    if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    localStorage.setItem('completedTasks', JSON.stringify(Array.from(newCompleted)));
  };

  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    sections.forEach(section => {
      section.days.forEach(day => {
        day.blocks.forEach(block => {
          block.tasks.forEach(task => {
            total++;
            if (completedTasks.has(task.id)) {
              completed++;
            }
          });
        });
      });
    });
    return { total, completed, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [sections, completedTasks]);

  const currentSectionIndex = sections.findIndex(s => s.title === activeTab);

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setActiveTab(sections[currentSectionIndex - 1].title);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setActiveTab(sections[currentSectionIndex + 1].title);
    }
  };

  const renderPaginationItems = () => {
    const totalPages = sections.length;
    const currentPage = currentSectionIndex + 1;
    const items = [];
    
    // Logic to show a window of pages. 
    // User asked for "1 to 10 buttons", so we try to show a generous window.
    // We'll show up to 5 pages around the current page, plus first and last.
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      if (currentPage > 3) {
        items.push('ellipsis-start');
      }

      // Calculate window around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust window if near start or end to show more pages
      if (currentPage < 4) {
        end = Math.min(totalPages - 1, 5);
      }
      if (currentPage > totalPages - 3) {
        start = Math.max(2, totalPages - 4);
      }

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - 2) {
        items.push('ellipsis-end');
      }

      // Always show last page
      items.push(totalPages);
    }

    return items.map((item, index) => {
      if (item === 'ellipsis-start' || item === 'ellipsis-end') {
        return (
          <PaginationItem key={`${item}-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      const pageNum = item as number;
      return (
        <PaginationItem key={pageNum}>
          <PaginationLink
            href="#"
            isActive={pageNum === currentPage}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(sections[pageNum - 1].title);
            }}
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  if (sections.length === 0) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold"> JS / DSA / Aptitude </h1>
            <p className="text-muted-foreground mt-2">30-Day Intensive Plan</p>
          </div>
        </div>

        <Card className='bg-transparent border-none'>
          <Progress value={stats.percentage} className="h-1" />
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto no-scrollbar rounded-lg border bg-card/30 p-2 mb-6">
            <TabsList className="inline-flex w-max h-auto bg-transparent p-0 gap-2">
              {sections.map((section) => (
                <TabsTrigger 
                  key={section.title} 
                  value={section.title}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-full transition-all"
                >
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {sections.map((section) => (
            <TabsContent key={section.title} value={section.title} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {section.days.map((day) => (
                <div key={day.title} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {day.blocks.map((block) => {
                      const isCompleted = block.tasks.length > 0 && block.tasks.every(t => completedTasks.has(t.id));
                      return (
                        <Card 
                          key={block.title} 
                          className={`group/card relative overflow-hidden backdrop-blur-sm transition-all duration-300 ${
                            isCompleted 
                              ? "border-green-500/50 bg-green-500/10 hover:border-green-500/70 hover:shadow-lg hover:shadow-green-500/10" 
                              : "border-border/40 bg-gradient-to-br from-card/80 to-card/30 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ${
                            isCompleted ? "from-green-500/10" : "from-primary/5"
                          }`} />
                          <CardHeader className="relative">
                            <CardTitle className={`text-base font-semibold tracking-tight transition-colors ${
                              isCompleted ? "text-green-400" : "text-primary/90 group-hover/card:text-primary"
                            }`}>
                              {block.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pt-0 space-y-3 relative">
                            {block.tasks.map((task) => (
                              <div key={task.id} className="flex items-start space-x-3 group">
                                <Checkbox 
                                  id={task.id} 
                                  checked={completedTasks.has(task.id)}
                                  onCheckedChange={() => toggleTask(task.id)}
                                  className={`mt-0.5 ${
                                    isCompleted 
                                      ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 border-green-500/50" 
                                      : "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  }`}
                                />
                                <label
                                  htmlFor={task.id}
                                  className={`text-sm leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all cursor-pointer select-none ${
                                    completedTasks.has(task.id) 
                                      ? 'text-muted-foreground line-through decoration-primary/50' 
                                      : 'text-foreground group-hover:text-primary/90'
                                  }`}
                                >
                                  {task.text}
                                </label>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        <div className="py-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrev();
                  }}
                  className={currentSectionIndex <= 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  className={currentSectionIndex >= sections.length - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
