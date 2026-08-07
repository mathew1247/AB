export interface Concept {
  id: string;
  name: string;
  keywords: string[];
}

export interface Topic {
  id: string;
  name: string;
  concepts: Concept[];
}

export interface Curriculum {
  id: string;
  title: string;
  topics: Topic[];
}
