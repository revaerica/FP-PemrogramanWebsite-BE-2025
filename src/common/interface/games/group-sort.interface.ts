export interface IGroupSortJson {
  score_per_item: number;
  time_limit: number;
  is_category_randomized: boolean;
  is_item_randomized: boolean;
  categories: IGroupSortCategory[];
}

export interface IGroupSortCategory {
  category_name: string;
  items: IGroupSortItem[];
}

export interface IGroupSortItem {
  item_text: string;
  item_image: string | null;
  item_hint?: string;
}
