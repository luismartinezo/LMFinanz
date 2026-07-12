export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  parentCategoryId: string | null;
  name: string;
  type: CategoryType;
  systemDefined: boolean;
  active: boolean;
}

export interface CategoryRequest {
  parentCategoryId: string | null;
  name: string;
  type: CategoryType;
}
