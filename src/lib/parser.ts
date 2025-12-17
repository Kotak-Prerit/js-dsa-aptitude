export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Block {
  title: string;
  tasks: Task[];
}

export interface Day {
  title: string;
  blocks: Block[];
}

export interface Section {
  title: string;
  days: Day[];
}

export function parseStudyPlan(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentDay: Day | null = null;
  let currentBlock: Block | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      currentSection = {
        title: trimmed.replace('## ', '').trim(),
        days: []
      };
      sections.push(currentSection);
      // Implicitly create a day for this section so blocks can be added directly
      currentDay = {
        title: currentSection.title,
        blocks: []
      };
      currentSection.days.push(currentDay);
      currentBlock = null;
    } else if (trimmed.startsWith('### ')) {
      if (!currentSection) {
         currentSection = { title: "Intro", days: [] };
         sections.push(currentSection);
      }
      
      const dayTitle = trimmed.replace('### ', '').trim();
      
      // If the current day is the implicit one (empty and title matches section), rename it
      if (currentDay && currentDay.blocks.length === 0 && currentDay.title === currentSection.title) {
        currentDay.title = dayTitle;
      } else {
        currentDay = {
          title: dayTitle,
          blocks: []
        };
        currentSection.days.push(currentDay);
      }
      currentBlock = null;
    } else if (trimmed.startsWith('#### ')) {
      if (!currentDay) continue;
      currentBlock = {
        title: trimmed.replace('#### ', '').trim(),
        tasks: []
      };
      currentDay.blocks.push(currentBlock);
    } else if (trimmed.startsWith('- ')) {
      if (!currentBlock) continue;
      const text = trimmed.replace('- ', '').trim();
      currentBlock.tasks.push({
        id: '', // Placeholder
        text: text,
        completed: false
      });
    }
  }
  
  // Post-process to add unique IDs
  return sections.map((section, sIdx) => ({
    ...section,
    days: section.days.map((day, dIdx) => ({
      ...day,
      blocks: day.blocks.map((block, bIdx) => ({
        ...block,
        tasks: block.tasks.map((task, tIdx) => ({
          ...task,
          id: `s${sIdx}-d${dIdx}-b${bIdx}-t${tIdx}`
        }))
      }))
    }))
  }));
}
